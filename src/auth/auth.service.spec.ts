import { Test } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.model';
import { Task } from '../tasks/task.model';
import { TaskAssignee } from '../tasks/taskAssignee.model';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService (unit, sqlite)', () => {
  let auth: AuthService;
  let users: UsersService;
  let jwt: JwtService;

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
        JwtModule.register({
          secret: 'test_secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [UsersService, AuthService],
    }).compile();

    auth = moduleRef.get(AuthService);
    users = moduleRef.get(UsersService);
    jwt = moduleRef.get(JwtService);
  });

  it('validateUser succeeds with correct credentials', async () => {
    const u = await users.create({
      email: 'a@example.com',
      name: 'Alice',
      password: 'secret123',
    });
    const res = await auth.validateUser('a@example.com', 'secret123');
    expect(res.id).toBe(u.id);
  });

  it('validateUser fails with wrong email', async () => {
    await expect(
      auth.validateUser('missing@example.com', 'secret123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validateUser fails with wrong password', async () => {
    await users.create({
      email: 'b@example.com',
      name: 'Bob',
      password: 'secret123',
    });
    await expect(
      auth.validateUser('b@example.com', 'badpass'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns a valid JWT containing sub/email/name', async () => {
    const u = await users.create({
      email: 'c@example.com',
      name: 'Carol',
      password: 'secret123',
    });
    const { access_token } = await auth.login(u.id, u.email, u.name);
    expect(access_token).toBeDefined();
    const decoded: any = jwt.decode(access_token);
    expect(decoded.sub).toBe(u.id);
    expect(decoded.email).toBe('c@example.com');
    expect(decoded.name).toBe('Carol');
  });
});
