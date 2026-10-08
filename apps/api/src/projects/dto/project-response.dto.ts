import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class ProjectResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiProperty({ example: 'Project Alpha' })
  name!: string;

  @ApiPropertyOptional({ example: 'Core application redesign' })
  description!: string | null;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.IN_PROGRESS })
  status!: ProjectStatus;

  @ApiPropertyOptional({ example: '2026-10-01' })
  startDate!: Date | null;

  @ApiPropertyOptional({ example: '2026-10-31' })
  endDate!: Date | null;

  @ApiProperty({ example: '2026-10-07T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-07T00:00:00.000Z' })
  updatedAt!: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 45 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class PaginatedProjectsResponseDto {
  @ApiProperty({ type: () => [ProjectResponseDto] })
  items!: ProjectResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  pagination!: PaginationMetaDto;
}
