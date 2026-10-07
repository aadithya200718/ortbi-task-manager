import {
  ValidateIf,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsDateOnly, IsDateRangeValid } from '../utils/date.util';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Name of the project',
    example: 'ISMO Assessment',
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
    description: 'Detailed description of the project',
    example: 'Full Stack Developer assessment project',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(5000, { message: 'description must not exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Current progress status of the project',
    enum: ProjectStatus,
    default: ProjectStatus.NOT_STARTED,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProjectStatus, {
    message:
      'status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Target start date (YYYY-MM-DD)',
    example: '2026-10-07',
  })
  @IsOptional()
  @IsDateOnly()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Target completion end date (YYYY-MM-DD)',
    example: '2026-10-10',
  })
  @IsOptional()
  @IsDateOnly()
  @IsDateRangeValid()
  endDate?: string;
}
