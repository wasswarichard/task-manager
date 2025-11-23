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
    createdBy: { id: 'u1', email: 'a@e.com', name: 'Alice' },
    assignees: [{ id: 'u2', email: 'b@e.com', name: 'Bob' }],
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
            findAllPresented: jest.fn(),
            findOnePresented: jest.fn(),
            createAndReturnPresented: jest.fn(),
            updateAndReturnPresented: jest.fn(),
            removeAndReturnSuccess: jest.fn(),
            assignAndReturnSuccess: jest.fn(),
            unassignAndReturnSuccess: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(TasksController);
    service = moduleRef.get(TasksService);
  });

  it('findAll forwards filters to service and returns presented', async () => {
    (service.findAllPresented as jest.Mock).mockResolvedValue([
      makeTask(),
      makeTask({ id: 't2', title: 'Another' }),
    ]);

    const res = await controller.findAll(
      TaskStatus.OPEN,
      'creator-1',
      'assignee-1',
    );

    expect(service.findAllPresented).toHaveBeenCalledWith({
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
      createdBy: { id: 'u1', email: 'a@e.com', name: 'Alice' },
      assignees: [{ id: 'u2', email: 'b@e.com', name: 'Bob' }],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });
  });

  it('findOne delegates to service presented method', async () => {
    (service.findOnePresented as jest.Mock).mockResolvedValue(
      makeTask({ id: 'tx' }),
    );
    const res = await controller.findOne('tx');
    expect(service.findOnePresented).toHaveBeenCalledWith('tx');
    expect(res.id).toBe('tx');
    expect(res.createdBy).toEqual({
      id: 'u1',
      email: 'a@e.com',
      name: 'Alice',
    });
    expect(res.assignees).toEqual([
      { id: 'u2', email: 'b@e.com', name: 'Bob' },
    ]);
  });

  it('create uses req.user.userId and returns presented created task', async () => {
    (service.createAndReturnPresented as jest.Mock).mockResolvedValue(
      makeTask({ id: 'newId' }),
    );

    const res = await controller.create(
      { title: 'New Task' } as any,
      { user: { userId: 'creator-123' } } as any,
    );

    expect(service.createAndReturnPresented).toHaveBeenCalledWith(
      { title: 'New Task' },
      'creator-123',
    );
    expect(res.id).toBe('newId');
  });

  it('update returns presented task', async () => {
    (service.updateAndReturnPresented as jest.Mock).mockResolvedValue(
      makeTask({ id: 'to-update', title: 'Updated' }),
    );
    const res = await controller.update('to-update', {
      title: 'Updated',
    } as any);
    expect(service.updateAndReturnPresented).toHaveBeenCalledWith('to-update', {
      title: 'Updated',
    });
    expect(res.title).toBe('Updated');
  });

  it('remove returns success true', async () => {
    (service.removeAndReturnSuccess as jest.Mock).mockResolvedValue({
      success: true,
    });
    const res = await controller.remove('to-delete');
    expect(service.removeAndReturnSuccess).toHaveBeenCalledWith('to-delete');
    expect(res).toEqual({ success: true });
  });

  it('assign calls service and returns success', async () => {
    (service.assignAndReturnSuccess as jest.Mock).mockResolvedValue({
      success: true,
    });
    const res = await controller.assign('t1', { userId: 'u9' } as any);
    expect(service.assignAndReturnSuccess).toHaveBeenCalledWith('t1', 'u9');
    expect(res).toEqual({ success: true });
  });

  it('unassign calls service and returns success', async () => {
    (service.unassignAndReturnSuccess as jest.Mock).mockResolvedValue({
      success: true,
    });
    const res = await controller.unassign('t1', { userId: 'u9' } as any);
    expect(service.unassignAndReturnSuccess).toHaveBeenCalledWith('t1', 'u9');
    expect(res).toEqual({ success: true });
  });
});
