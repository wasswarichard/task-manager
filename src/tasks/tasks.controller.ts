import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignUserDto } from './dto/assign-user.dto';
import { TaskStatus } from './task.model';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with optional filters' })
  @ApiOkResponse({ description: 'Returns tasks with assignees and creator' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'createdById', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('createdById') createdById?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.tasksService.findAllPresented({
      status,
      createdById,
      assigneeId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiOkResponse({ description: 'Returns a single task with relations' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOnePresented(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiOkResponse({ description: 'Returns the created task' })
  async create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.createAndReturnPresented(dto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiOkResponse({ description: 'Returns the updated task' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.updateAndReturnPresented(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiOkResponse({ description: 'Returns { success: true } on success' })
  async remove(@Param('id') id: string) {
    return this.tasksService.removeAndReturnSuccess(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a user to a task (idempotent)' })
  @ApiOkResponse({ description: 'Returns { success: true }' })
  async assign(@Param('id') id: string, @Body() dto: AssignUserDto) {
    return this.tasksService.assignAndReturnSuccess(id, dto.userId);
  }

  @Post(':id/unassign')
  @ApiOperation({ summary: 'Unassign a user from a task' })
  @ApiOkResponse({ description: 'Returns { success: true }' })
  async unassign(@Param('id') id: string, @Body() dto: AssignUserDto) {
    return this.tasksService.unassignAndReturnSuccess(id, dto.userId);
  }
}
