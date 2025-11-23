import { Test } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './task.model';
import { TaskAssignee } from './taskAssignee.model';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TasksService (unit, sqlite)', () => {
  let tasks: TasksService;
  let users: UsersService;
  let creator: User;
  let assignee: User;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          autoLoadModels: true,
          synchronize: true,
          logging: false,
          models: [User, Task, TaskAssignee],
        }),
        SequelizeModule.forFeature([User, Task, TaskAssignee]),
      ],
      providers: [UsersService, TasksService],
    }).compile();

    tasks = moduleRef.get(TasksService);
    users = moduleRef.get(UsersService);

    creator = await users.create({
      email: 'creator@example.com',
      name: 'Creator',
      password: 'secret123',
    });
    assignee = await users.create({
      email: 'assignee@example.com',
      name: 'Assignee',
      password: 'secret123',
    });
  });

  it('creates task and parses dueDate', async () => {
    const t = await tasks.create(
      { title: 'Task A', dueDate: '2030-01-01', status: TaskStatus.OPEN },
      creator.id,
    );
    expect(t.id).toBeDefined();
    expect(t.dueDate).toBeInstanceOf(Date);
  });

  it('findOne throws for missing task', async () => {
    await expect(
      tasks.findOne('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update handles fields and nullable description/dueDate', async () => {
    const created = await tasks.create(
      { title: 'Task B', description: 'desc', dueDate: '2030-01-02' },
      creator.id,
    );
    const updated = await tasks.update(created.id, {
      title: 'Task B2',
      description: null as any,
      dueDate: null as any,
      status: TaskStatus.IN_PROGRESS,
    });
    expect(updated.title).toBe('Task B2');
    expect(updated.description).toBeNull();
    expect(updated.dueDate).toBeNull();
    expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('assign is idempotent and unassign works; unassign of non-assigned throws', async () => {
    const created = await tasks.create({ title: 'Task C' }, creator.id);
    await tasks.assign(created.id, assignee.id);
    await tasks.assign(created.id, assignee.id); // idempotent

    // unassign success
    await tasks.unassign(created.id, assignee.id);

    // unassign again -> error
    await expect(
      tasks.unassign(created.id, assignee.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findAll supports filters: status, createdById, assigneeId', async () => {
    const t1 = await tasks.create(
      { title: 'T1', status: TaskStatus.OPEN },
      creator.id,
    );
    const t2 = await tasks.create(
      { title: 'T2', status: TaskStatus.DONE },
      creator.id,
    );
    await tasks.assign(t2.id, assignee.id);

    const all = await tasks.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const byStatus = await tasks.findAll({ status: TaskStatus.DONE });
    expect(byStatus.every((t) => t.status === TaskStatus.DONE)).toBe(true);

    const byCreator = await tasks.findAll({ createdById: creator.id });
    expect(byCreator.length).toBeGreaterThan(0);

    const byAssignee = await tasks.findAll({ assigneeId: assignee.id });
    expect(byAssignee.find((t) => t.id === t2.id)).toBeTruthy();
    expect(byAssignee.find((t) => t.id === t1.id)).toBeFalsy();
  });
});
