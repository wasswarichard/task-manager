import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task, TaskStatus } from './task.model';
import { TaskAssignee } from './taskAssignee.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Op } from 'sequelize';
import { User } from '../users/user.model';

type ListFilters = {
  status?: TaskStatus;
  createdById?: string;
  assigneeId?: string;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task) private readonly taskModel: typeof Task,
    @InjectModel(TaskAssignee)
    private readonly taskAssignee: typeof TaskAssignee,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async create(dto: CreateTaskDto, createdById: string): Promise<Task> {
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    return this.taskModel.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? TaskStatus.OPEN,
      dueDate,
      createdById,
    } as any);
  }

  async findAll(filters: ListFilters = {}): Promise<Task[]> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.createdById) where.createdById = filters.createdById;

    const include: any[] = [
      {
        model: User,
        as: 'assignees',
        through: { attributes: [] },
        attributes: ['id', 'email', 'name'],
      },
      { model: User, as: 'createdBy', attributes: ['id', 'email', 'name'] },
    ];

    let tasks = await this.taskModel.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });

    if (filters.assigneeId) {
      tasks = tasks.filter((t) =>
        (t.assignees || []).some((a) => a.id === filters.assigneeId),
      );
    }

    return tasks;
  }

  // Presentation helpers moved from controller
  present(t: any) {
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      dueDate: t.dueDate,
      createdBy: t.createdBy
        ? { id: t.createdBy.id, email: t.createdBy.email, name: t.createdBy.name }
        : undefined,
      assignees: (t.assignees || []).map((a: any) => ({ id: a.id, email: a.email, name: a.name })),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  async findAllPresented(filters: ListFilters = {}) {
    const tasks = await this.findAll(filters);
    return tasks.map((t) => this.present(t));
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
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async findOnePresented(id: string) {
    const t = await this.findOne(id);
    return this.present(t);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined)
      task.description = dto.description ?? null;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.dueDate !== undefined)
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    await task.save();
    return this.findOne(id);
  }

  async updateAndReturnPresented(id: string, dto: UpdateTaskDto) {
    const t = await this.update(id, dto);
    return this.present(t);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await task.destroy();
  }

  async removeAndReturnSuccess(id: string) {
    await this.remove(id);
    return { success: true } as const;
  }

  async assign(taskId: string, userId: string): Promise<void> {
    const [task, user] = await Promise.all([
      this.taskModel.findByPk(taskId),
      this.userModel.findByPk(userId),
    ]);
    if (!task) throw new NotFoundException('Task not found');
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.taskAssignee.findOne({
      where: { taskId, userId },
    });
    if (existing) return; // idempotent
    await this.taskAssignee.create({ taskId, userId } as any);
  }

  async assignAndReturnSuccess(taskId: string, userId: string) {
    await this.assign(taskId, userId);
    return { success: true } as const;
  }

  async unassign(taskId: string, userId: string): Promise<void> {
    const existing = await this.taskAssignee.findOne({
      where: { taskId, userId },
    });
    if (!existing)
      throw new BadRequestException('User is not assigned to this task');
    await existing.destroy();
  }

  async unassignAndReturnSuccess(taskId: string, userId: string) {
    await this.unassign(taskId, userId);
    return { success: true } as const;
  }

  async createAndReturnPresented(dto: CreateTaskDto, createdById: string) {
    const created = await this.create(dto, createdById);
    const t = await this.findOne(created.id);
    return this.present(t);
  }
}
