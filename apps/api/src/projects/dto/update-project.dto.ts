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
import { ProjectStatus } from '@prisma/client';
import { IsDateOnly, IsDateRangeValid } from '../utils/date.util';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Name of the project',
    example: 'ISMO Assessment Updated',
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
    description: 'Detailed description of the project',
    example: 'Updated project description',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(5000, { message: 'description must not exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Current progress status of the project',
    enum: ProjectStatus,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProjectStatus, {
    message:
      'status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Target start date (YYYY-MM-DD)',
    example: '2026-10-08',
  })
  @IsOptional()
  @IsDateOnly()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Target completion end date (YYYY-MM-DD)',
    example: '2026-10-12',
  })
  @IsOptional()
  @IsDateOnly()
  @IsDateRangeValid()
  endDate?: string;
}
