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
            findAllPublic: jest.fn(),
            findPublicById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(UsersController);
    usersService = moduleRef.get(UsersService);
  });

  it('findAll delegates to service public projection', async () => {
    (usersService.findAllPublic as jest.Mock).mockResolvedValue([
      { id: 'u1', email: 'a@e.com', name: 'Alice' } as any,
      { id: 'u2', email: 'b@e.com', name: 'Bob' } as any,
    ]);

    const res = await controller.findAll();
    expect(res).toEqual([
      { id: 'u1', email: 'a@e.com', name: 'Alice' },
      { id: 'u2', email: 'b@e.com', name: 'Bob' },
    ]);
    expect(usersService.findAllPublic).toHaveBeenCalled();
  });

  it('findOne delegates to service public projection', async () => {
    (usersService.findPublicById as jest.Mock).mockResolvedValue({
      id: 'u3',
      email: 'c@e.com',
      name: 'Carol',
    } as any);

    const res = await controller.findOne('u3');
    expect(usersService.findPublicById).toHaveBeenCalledWith('u3');
    expect(res).toEqual({ id: 'u3', email: 'c@e.com', name: 'Carol' });
  });
});
