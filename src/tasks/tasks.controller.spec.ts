import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus } from './task.model';

describe('TasksController (unit)', () => {
  let controller: TasksController;
  let service: jest.Mocked<TasksService>;

  const makeTask = (over: Partial<any> = {}) => ({
    id: 't1',
    title: 'Title',
    description: 'Desc',
    status: TaskStatus.OPEN,
    dueDate: new Date('2030-01-01'),
    createdBy: {
      id: '5dedd39b-3c83-4b68-aa01-62192815af05',
      email: 'a@e.com',
      name: 'Alice',
    },
    assignees: [
      {
        id: 'e8dac33e-e0f7-4a27-9c3c-3c629b9807a5',
        email: 'b@e.com',
        name: 'Bob',
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...over,
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            assign: jest.fn(),
            unassign: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(TasksController);
    service = moduleRef.get(TasksService);
  });

  it('findAll forwards filters to service and returns tasks', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([
      makeTask(),
      makeTask({ id: 't2', title: 'Another' }),
    ]);

    const res = await controller.findAll(
      TaskStatus.OPEN,
      'creator-1',
      'assignee-1',
    );

    expect(service.findAll).toHaveBeenCalledWith({
      status: TaskStatus.OPEN,
      createdById: 'creator-1',
      assigneeId: 'assignee-1',
    });
    expect(res[0]).toEqual({
      id: 't1',
      title: 'Title',
      description: 'Desc',
      status: TaskStatus.OPEN,
      dueDate: new Date('2030-01-01'),
      createdBy: {
        id: '5dedd39b-3c83-4b68-aa01-62192815af05',
        email: 'a@e.com',
        name: 'Alice',
      },
      assignees: [
        {
          id: 'e8dac33e-e0f7-4a27-9c3c-3c629b9807a5',
          email: 'b@e.com',
          name: 'Bob',
        },
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });
  });

  it('findOne delegates to service findOne', async () => {
    (service.findOne as jest.Mock).mockResolvedValue(makeTask({ id: 'tx' }));
    const res = await controller.findOne('tx');
    expect(service.findOne).toHaveBeenCalledWith('tx');
    expect(res.id).toBe('tx');
    expect(res.createdBy).toEqual({
      id: '5dedd39b-3c83-4b68-aa01-62192815af05',
      email: 'a@e.com',
      name: 'Alice',
    });
    expect(res.assignees).toEqual([
      {
        id: 'e8dac33e-e0f7-4a27-9c3c-3c629b9807a5',
        email: 'b@e.com',
        name: 'Bob',
      },
    ]);
  });

  it('update returns updated task', async () => {
    (service.update as jest.Mock).mockResolvedValue(
      makeTask({
        id: 'fb91dd43-9f94-4301-b44f-94cd190edba3',
        title: 'Updated',
      }),
    );
    const { task: task } = await controller.update(
      'fb91dd43-9f94-4301-b44f-94cd190edba3',
      {
        title: 'Updated',
      } as any,
    );
    expect(service.update).toHaveBeenCalledWith(
      'fb91dd43-9f94-4301-b44f-94cd190edba3',
      {
        title: 'Updated',
      },
    );
  });

  it('remove delegates to service.remove and returns void', async () => {
    (service.remove as jest.Mock).mockResolvedValue(undefined);
    const res = await controller.remove('to-delete');
    expect(service.remove).toHaveBeenCalledWith('to-delete');
    expect(res).toBeUndefined();
  });

  it('assign calls service.assign and returns void', async () => {
    (service.assign as jest.Mock).mockResolvedValue(undefined);
    const res = await controller.assign('t1', { userId: 'u9' } as any);
    expect(service.assign).toHaveBeenCalledWith('t1', 'u9');
    expect(res).toBeUndefined();
  });

  it('unassign calls service.unassign', async () => {
    (service.unassign as jest.Mock).mockResolvedValue(undefined);
    const res = await controller.unassign('t1', { userId: 'u9' } as any);
    expect(service.unassign).toHaveBeenCalledWith('t1', 'u9');
    expect(res).toBeUndefined();
  });
});
