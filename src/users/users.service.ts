import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    } as any);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({
      attributes: { exclude: ['passwordHash'] },
    });
  }

  // Returns public-safe projection for all users (no password fields)
  async findAllPublic(): Promise<{ id: string; email: string; name: string }[]> {
    const users = await this.findAll();
    return users.map((u) => ({ id: u.id, email: u.email, name: u.name }));
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Returns a single user projected to public-safe shape
  async findPublicById(id: string): Promise<{ id: string; email: string; name: string }> {
    const u = await this.findById(id);
    return { id: u.id, email: u.email, name: u.name };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }
}
