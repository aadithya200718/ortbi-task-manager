import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService, PaginatedTasksResponse } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';
import { Task } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task under a project' })
  @ApiResponse({
    status: 201,
    description: 'Task successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or malformed input',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found or not owned by caller',
  })
  async create(
    @CurrentUser() user: SafeUser,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks for authenticated user projects' })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully with pagination metadata',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  async findAll(
    @CurrentUser() user: SafeUser,
    @Query() queryDto: TaskQueryDto,
  ): Promise<PaginatedTasksResponse> {
    return this.tasksService.findAll(user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details by ID' })
  @ApiParam({ name: 'id', description: 'Task UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Task details retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Malformed or invalid UUID',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found or parent project not owned by caller',
  })
  async findById(
    @CurrentUser() user: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Task> {
    return this.tasksService.findById(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task by ID' })
  @ApiParam({ name: 'id', description: 'Task UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Task successfully updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found or parent project not owned by caller',
  })
  async update(
    @CurrentUser() user: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(user.id, id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiParam({ name: 'id', description: 'Task UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Task successfully deleted',
  })
  @ApiResponse({
    status: 400,
    description: 'Malformed or invalid UUID',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found or parent project not owned by caller',
  })
  async delete(
    @CurrentUser() user: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.tasksService.delete(user.id, id);
  }
}
