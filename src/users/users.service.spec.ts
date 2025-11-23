import { Test } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { User } from './user.model';
import { Task } from '../tasks/task.model';
import { TaskAssignee } from '../tasks/taskAssignee.model';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService (unit, sqlite)', () => {
  let service: UsersService;

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
        SequelizeModule.forFeature([User]),
      ],
      providers: [UsersService],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('creates a user and hashes password', async () => {
    const user = await service.create({
      email: 'a@example.com',
      name: 'Alice',
      password: 'secret123',
    });
    expect(user.id).toBeDefined();
    expect(user.passwordHash).not.toEqual('secret123');
  });

  it('throws on duplicate email', async () => {
    await service.create({
      email: 'dup@example.com',
      name: 'X',
      password: 'secret123',
    });
    await expect(
      service.create({
        email: 'dup@example.com',
        name: 'Y',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll excludes passwordHash', async () => {
    await service.create({
      email: 'b@example.com',
      name: 'Bob',
      password: 'secret123',
    });
    const list = await service.findAll();
    expect(list.length).toBeGreaterThan(0);
    for (const u of list) {
      expect((u as any).passwordHash).toBeUndefined();
    }
  });

  it('findById throws NotFound for missing id', async () => {
    await expect(
      service.findById('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
