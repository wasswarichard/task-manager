import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates a user's credentials.
   * @param email User email
   * @param password Plain-text password to verify
   * @throws UnauthorizedException when email is unknown or password is invalid
   * @returns The persisted user entity
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Invalid login attempt: unknown email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Invalid login attempt: wrong password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  /**
   * Issues a JWT access token for a given user identity.
   * @param userId User id (subject)
   * @param email User email (embedded as claim)
   * @param name User name (embedded as claim)
   */
  async login(userId: string, email: string, name: string) {
    const payload = { sub: userId, email, name };
    this.logger.log(`Issuing JWT for user ${userId}`);
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  /**
   * Registers a new user.
   */
  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    this.logger.log(`Registered new user ${user.id} (${user.email})`);
    return { id: user.id, email: user.email, name: user.name };
  }

  /**
   * Validates credentials then returns `{ user, access_token }`.
   * @param dto Login payload
   */
  async loginWithCredentials(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const token = await this.login(user.id, user.email, user.name);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...token,
    };
  }
}
