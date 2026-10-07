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
import { ProjectsService, PaginatedProjectsResponse } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';
import { Project } from '@prisma/client';

@ApiTags('Projects')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'Project successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or malformed date range',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  async create(
    @CurrentUser() user: SafeUser,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    return this.projectsService.create(user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully with pagination metadata',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  async findAll(
    @CurrentUser() user: SafeUser,
    @Query() queryDto: ProjectQueryDto,
  ): Promise<PaginatedProjectsResponse> {
    return this.projectsService.findAll(user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Project details retrieved successfully',
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
    description: 'Project not found or not owned by caller',
  })
  async findById(
    @CurrentUser() user: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Project> {
    return this.projectsService.findById(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Project successfully updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid effective date range',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found or not owned by caller',
  })
  async update(
    @CurrentUser() user: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(user.id, id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Project successfully deleted',
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
    description: 'Project not found or not owned by caller',
  })
  async delete(
    @CurrentUser() user: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.projectsService.delete(user.id, id);
  }
}
