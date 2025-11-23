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

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    @InjectModel(Task) private readonly taskModel: typeof Task,
    @InjectModel(TaskAssignee)
    private readonly taskAssignee: typeof TaskAssignee,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

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

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const [_, [updated]] = await Task.update(dto, {
      where: { id },
      returning: true,
    });

    return updated;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await task.destroy();
    this.logger.log(`Deleted task ${id}`);
  }

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
