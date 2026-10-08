import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { PaginationMetaDto } from '../../projects/dto/project-response.dto';

export class TaskResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  projectId!: string;

  @ApiProperty({ example: 'Implement Authentication' })
  name!: string;

  @ApiPropertyOptional({ example: 'Setup JWT guard and passport strategy' })
  description!: string | null;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  priority!: TaskPriority;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  status!: TaskStatus;

  @ApiPropertyOptional({ example: '2026-10-15' })
  dueDate!: Date | null;

  @ApiPropertyOptional({ example: '2026-10-14T12:00:00.000Z' })
  completedAt!: Date | null;

  @ApiProperty({ example: '2026-10-07T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-07T00:00:00.000Z' })
  updatedAt!: Date;
}

export class PaginatedTasksResponseDto {
  @ApiProperty({ type: () => [TaskResponseDto] })
  items!: TaskResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  pagination!: PaginationMetaDto;
}
