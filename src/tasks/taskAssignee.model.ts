import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
} from 'sequelize-typescript';
import { Task } from './task.model';
import { User } from '../users/user.model';

/**
 * table for Task <-> User many-to-many assignments.
 *
 * Contains only foreign keys and no timestamps. Each row represents that a
 * user is assigned to a task. Unassignment deletes the row.
 */
@Table({ tableName: 'task_assignees', timestamps: false })
export class TaskAssignee extends Model<TaskAssignee> {
  @ForeignKey(() => Task)
  @Column({ type: DataType.UUID, allowNull: false })
  taskId!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;
}
