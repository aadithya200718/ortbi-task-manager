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
import { TaskResponseDto, PaginatedTasksResponseDto } from './dto/task-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
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
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or malformed input',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found or not owned by caller',
    type: ErrorResponseDto,
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
    type: PaginatedTasksResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: ErrorResponseDto,
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
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Malformed or invalid UUID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found or parent project not owned by caller',
    type: ErrorResponseDto,
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
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid input',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found or parent project not owned by caller',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Task was modified concurrently',
    type: ErrorResponseDto,
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
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found or parent project not owned by caller',
    type: ErrorResponseDto,
  })
  async delete(
    @CurrentUser() user: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.tasksService.delete(user.id, id);
  }
}
