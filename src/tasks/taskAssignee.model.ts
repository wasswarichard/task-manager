import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
} from 'sequelize-typescript';
import { Task } from './task.model';
import { User } from '../users/user.model';

@Table({ tableName: 'task_assignees', timestamps: false })
export class TaskAssignee extends Model<TaskAssignee> {
  @ForeignKey(() => Task)
  @Column({ type: DataType.UUID, allowNull: false })
  taskId!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;
}
