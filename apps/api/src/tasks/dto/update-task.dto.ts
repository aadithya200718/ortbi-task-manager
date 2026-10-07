import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { IsDateOnly } from '../../projects/utils/date.util';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Updated title of the task',
    example: 'Implement Task API (Updated)',
    maxLength: 255,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'name must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'name should not be empty' })
  @MaxLength(255, { message: 'name must not exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the task',
    example: 'Updated task description',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(5000, { message: 'description must not exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated priority of the task',
    enum: TaskPriority,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TaskPriority, {
    message: 'priority must be one of: LOW, MEDIUM, HIGH',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Updated status of the task',
    enum: TaskStatus,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TaskStatus, {
    message: 'status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Updated due date of the task (YYYY-MM-DD)',
    example: '2026-10-15',
  })
  @IsOptional()
  @IsDateOnly()
  dueDate?: string;
}
