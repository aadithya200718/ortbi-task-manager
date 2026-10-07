import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const ALLOWED_TASK_SORT_FIELDS = [
  'createdAt',
  'dueDate',
  'name',
  'priority',
  'status',
] as const;

export type TaskSortField = (typeof ALLOWED_TASK_SORT_FIELDS)[number];
export type TaskSortOrder = 'asc' | 'desc';

export class TaskQueryDto {
  @ApiPropertyOptional({
    description: 'Filter tasks by project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'projectId must be a valid UUID' })
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter tasks by status',
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filter tasks by priority',
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority, {
    message: 'priority must be one of: LOW, MEDIUM, HIGH',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Case-insensitive search term matching task name',
    example: 'auth',
  })
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (maximum 100)',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ALLOWED_TASK_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(ALLOWED_TASK_SORT_FIELDS, {
    message: `sortBy must be one of: ${ALLOWED_TASK_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: TaskSortField = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be either asc or desc',
  })
  sortOrder?: TaskSortOrder = 'desc';
}
