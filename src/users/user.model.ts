import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  HasMany,
  DeletedAt,
} from 'sequelize-typescript';
import { Task } from '../tasks/task.model';

/**
 * User model (Sequelize)
 *
 * Represents an application user. Paranoid mode enables soft deletes via the
 * `deletedAt` column. Passwords are stored as a `passwordHash` and never
 * returned by list endpoints.
 */
@Table({ tableName: 'users', timestamps: true, paranoid: true })
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

  @DeletedAt
  @Column({ field: 'deleted_at', type: DataType.DATE })
  deletedAt?: Date | null;
}
