import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'name',
  'startDate',
  'endDate',
] as const;

export type SortField = (typeof ALLOWED_SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export class ProjectQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive search term matching project name',
    example: 'assessment',
  })
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter projects by status',
    enum: ProjectStatus,
  })
  @IsOptional()
  @IsEnum(ProjectStatus, {
    message:
      'status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status?: ProjectStatus;

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
    enum: ALLOWED_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(ALLOWED_SORT_FIELDS, {
    message: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: SortField = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be either asc or desc',
  })
  sortOrder?: SortOrder = 'desc';
}
