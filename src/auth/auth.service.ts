import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(userId: string, email: string, name: string) {
    const payload = { sub: userId, email, name };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return { id: user.id, email: user.email, name: user.name };
  }

  async loginWithCredentials(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const token = await this.login(user.id, user.email, user.name);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...token,
    };
  }
}
