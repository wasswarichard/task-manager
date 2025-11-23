import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Task } from './task.model';
import { TaskAssignee } from './taskAssignee.model';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { User } from '../users/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Task, TaskAssignee, User])],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
