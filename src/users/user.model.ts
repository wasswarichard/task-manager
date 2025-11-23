import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  HasMany,
} from 'sequelize-typescript';
import { Task } from '../tasks/task.model';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Unique
  @Column({ type: DataType.STRING, allowNull: false })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ field: 'password_hash', type: DataType.STRING, allowNull: false })
  passwordHash!: string;

  @HasMany(() => Task, 'createdById')
  createdTasks?: Task[];
}
