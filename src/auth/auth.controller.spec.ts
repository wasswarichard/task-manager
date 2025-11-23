import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (unit)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            loginWithCredentials: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
    authService = moduleRef.get(AuthService);
  });

  it('register returns user and token', async () => {
    const mockUser = { id: 'u1', email: 'a@e.com', name: 'Alice' } as any;
    (authService.register as jest.Mock).mockResolvedValue(mockUser);

    const res = await controller.register({
      email: 'a@e.com',
      name: 'Alice',
      password: 'secret123',
    });

    expect(authService.register).toHaveBeenCalledWith({
      email: 'a@e.com',
      name: 'Alice',
      password: 'secret123',
    });
    expect(res).toEqual(mockUser);
  });

  it('login validates credentials and returns token + user', async () => {
    const resp = {
      user: { id: 'u2', email: 'b@e.com', name: 'Bob' },
      access_token: 'token456',
    };
    (authService.loginWithCredentials as jest.Mock).mockResolvedValue(resp);

    const res = await controller.login({
      email: 'b@e.com',
      password: 'secret',
    });

    expect(authService.loginWithCredentials).toHaveBeenCalledWith({
      email: 'b@e.com',
      password: 'secret',
    });
    expect(res).toEqual(resp);
  });
});
