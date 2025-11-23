import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  BelongsTo,
  ForeignKey,
  BelongsToMany,
  DeletedAt,
} from 'sequelize-typescript';
import { User } from '../users/user.model';
import { TaskAssignee } from './taskAssignee.model';

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

/**
 * Task model (Sequelize)
 *
 * Represents a work item created by a user, optionally assigned to many users
 * via the `TaskAssignee` junction table. Paranoid mode enables soft deletes.
 */
@Table({ tableName: 'tasks', timestamps: true, paranoid: true })
export class Task extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description?: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.OPEN,
  })
  status!: TaskStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  dueDate?: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  createdById!: string;

  @BelongsTo(() => User, 'createdById')
  createdBy?: User;

  @BelongsToMany(() => User, () => TaskAssignee)
  assignees?: User[];

  @DeletedAt
  @Column({ field: 'deleted_at', type: DataType.DATE })
  deletedAt?: Date | null;
}
