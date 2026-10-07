import {
  ValidateIf,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { IsDateOnly } from '../../projects/utils/date.util';

export class CreateTaskDto {
  @ApiProperty({
    description: 'UUID of the parent project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'projectId is required' })
  @IsUUID(undefined, { message: 'projectId must be a valid UUID' })
  projectId!: string;

  @ApiProperty({
    description: 'Title of the task',
    example: 'Implement Task API',
    maxLength: 255,
  })
  @IsString({ message: 'name must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'name should not be empty' })
  @MaxLength(255, { message: 'name must not exceed 255 characters' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the task',
    example: 'Create authenticated task endpoints with relational ownership',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(5000, { message: 'description must not exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the task',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TaskPriority, {
    message: 'priority must be one of: LOW, MEDIUM, HIGH',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Status of the task',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TaskStatus, {
    message: 'status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Due date of the task (YYYY-MM-DD)',
    example: '2026-10-09',
  })
  @IsOptional()
  @IsDateOnly()
  dueDate?: string;
}
