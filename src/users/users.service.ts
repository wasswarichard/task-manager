import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      this.logger.warn(`Attempt to register with existing email: ${dto.email}`);
      throw new ConflictException('Email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const createdUser = await this.userModel.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    } as any);
    this.logger.log(`Created user ${createdUser.id} (${createdUser.email})`);
    return createdUser;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({
      attributes: { exclude: ['passwordHash'] },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  // Soft delete a user (paranoid)
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await user.destroy();
    this.logger.log(`Soft-deleted user ${id}`);
  }
}
