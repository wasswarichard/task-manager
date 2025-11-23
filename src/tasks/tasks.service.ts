import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task, TaskStatus } from './task.model';
import { TaskAssignee } from './taskAssignee.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../users/user.model';

type ListFilters = {
  status?: TaskStatus;
  createdById?: string;
  assigneeId?: string;
};

/**
 * Tasks domain service
 *
 * Encapsulates all business logic around tasks: creation, querying with
 * filters, fetching with relations, updates (using partial payloads),
 * soft-deletes, and assignee management. Controllers delegate to this layer
 * to keep HTTP concerns separated from domain logic.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    @InjectModel(Task) private readonly taskModel: typeof Task,
    @InjectModel(TaskAssignee)
    private readonly taskAssignee: typeof TaskAssignee,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  /**
   * Creates a new task for the given creator.
   * - Parses `dueDate` if provided, storing `null` when absent.
   * @param dto Task creation payload
   * @param createdById ID of the user creating the task
   */
  async create(dto: CreateTaskDto, createdById: string): Promise<Task> {
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    const created = await this.taskModel.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? TaskStatus.OPEN,
      dueDate,
      createdById,
    } as any);
    this.logger.log(`Created task ${created.id} by ${createdById}`);
    return created;
  }

  /**
   * Lists tasks with optional filters.
   * - `status` and `createdById` filter via `where` on the task row.
   * - `assigneeId` filters via include on the junction relation.
   * - Always includes `assignees` and `createdBy` with safe attributes.
   */
  async findAll(filters: ListFilters = {}): Promise<Task[]> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.createdById) where.createdById = filters.createdById;

    const assigneeInclude: any = {
      model: User,
      as: 'assignees',
      through: { attributes: [] },
      attributes: ['id', 'email', 'name'],
    };

    // Filter by assigneeId directly in the query if provided
    if (filters.assigneeId) {
      assigneeInclude.where = { id: filters.assigneeId };
    }

    const include: any[] = [
      assigneeInclude,
      { model: User, as: 'createdBy', attributes: ['id', 'email', 'name'] },
    ];

    return await this.taskModel.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Retrieves a single task by id including relations.
   * @throws NotFoundException when the task does not exist
   */
  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignees',
          through: { attributes: [] },
          attributes: ['id', 'email', 'name'],
        },
        { model: User, as: 'createdBy', attributes: ['id', 'email', 'name'] },
      ],
    });
    if (!task) {
      this.logger.warn(`Task not found: ${id}`);
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  /**
   * Partially updates a task using only fields provided on the DTO.
   *
   * Implementation detail: builds an `updates` object from defined DTO
   * properties using a filter, and converts `dueDate` to `Date` when present.
   * Returns a simple success message and the (reloaded) task entity.
   */
  async update(
    id: string,
    dto: UpdateTaskDto,
  ): Promise<{ message: string; task: Task }> {
    const task = await this.findOne(id);

    const updates = Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined),
    );

    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate as string);
    }

    await task.update(updates);
    this.logger.log(`Updated task ${id}`);

    return {
      message: 'Task updated successfully',
      task,
    };
  }

  /**
   * Soft-deletes a task (paranoid mode).
   */
  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await task.destroy();
    this.logger.log(`Deleted task ${id}`);
  }

  /**
   * Assigns a user to a task (idempotent).
   * - Returns a message and the junction row; if already assigned, the
   *   existing row is returned with a friendly message.
   * @throws NotFoundException when task or user is missing
   */
  async assign(
    taskId: string,
    userId: string,
  ): Promise<{ message: string; assignment: TaskAssignee }> {
    const [task, user] = await Promise.all([
      this.taskModel.findByPk(taskId),
      this.userModel.findByPk(userId),
    ]);

    if (!task) {
      this.logger.warn(`Assign failed: task not found ${taskId}`);
      throw new NotFoundException('Task not found');
    }
    if (!user) {
      this.logger.warn(`Assign failed: user not found ${userId}`);
      throw new NotFoundException('User not found');
    }

    const existing = await this.taskAssignee.findOne({
      where: { taskId, userId },
    });

    if (existing) {
      this.logger.debug(`user ${userId} already assigned to task ${taskId}`);
      return {
        message: 'User is already assigned to this task',
        assignment: existing,
      };
    }

    const created = await this.taskAssignee.create({ taskId, userId } as any);
    this.logger.log(`Assigned user ${userId} to task ${taskId}`);
    return {
      message: 'User assigned successfully',
      assignment: created,
    };
  }

  /**
   * Unassigns a user from a task.
   * @throws BadRequestException when the user is not currently assigned
   */
  async unassign(
    taskId: string,
    userId: string,
  ): Promise<{ message: string; taskId: string; userId: string }> {
    const existing = await this.taskAssignee.findOne({
      where: { taskId, userId },
    });

    if (!existing) {
      this.logger.warn(
        `Unassign failed: user ${userId} not assigned to task ${taskId}`,
      );
      throw new BadRequestException('User is not assigned to this task');
    }

    await existing.destroy();

    return {
      message: 'User unassigned successfully',
      taskId,
      userId,
    };
  }
}
