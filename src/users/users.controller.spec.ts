import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController (unit)', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(UsersController);
    usersService = moduleRef.get(UsersService);
  });

  it('findAll maps users to public shape', async () => {
    (usersService.findAll as jest.Mock).mockResolvedValue([
      { id: 'u1', email: 'a@e.com', name: 'Alice' },
      { id: 'u2', email: 'b@e.com', name: 'Bob' },
    ] as any);

    const res = await controller.findAll();
    expect(usersService.findAll).toHaveBeenCalled();
    expect(res).toEqual([
      { id: 'u1', email: 'a@e.com', name: 'Alice' },
      { id: 'u2', email: 'b@e.com', name: 'Bob' },
    ]);
  });

  it('findOne maps single user to public shape', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({
      id: 'u3',
      email: 'c@e.com',
      name: 'Carol',
    } as any);

    const res = await controller.findOne('u3');
    expect(usersService.findById).toHaveBeenCalledWith('u3');
    expect(res).toEqual({ id: 'u3', email: 'c@e.com', name: 'Carol' });
  });
});
