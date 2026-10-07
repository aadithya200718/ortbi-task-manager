import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Total number of projects owned by the authenticated user',
    example: 3,
  })
  totalProjects!: number;

  @ApiProperty({
    description: 'Number of projects with NOT_STARTED status',
    example: 1,
  })
  projectsNotStarted!: number;

  @ApiProperty({
    description: 'Number of projects with IN_PROGRESS status',
    example: 1,
  })
  projectsInProgress!: number;

  @ApiProperty({
    description: 'Number of projects with COMPLETED status',
    example: 1,
  })
  projectsCompleted!: number;

  @ApiProperty({
    description: 'Total number of tasks across all projects owned by the user',
    example: 10,
  })
  totalTasks!: number;

  @ApiProperty({
    description: 'Number of tasks with PENDING status',
    example: 3,
  })
  pendingTasks!: number;

  @ApiProperty({
    description: 'Number of tasks with IN_PROGRESS status',
    example: 2,
  })
  inProgressTasks!: number;

  @ApiProperty({
    description: 'Number of tasks with COMPLETED status',
    example: 5,
  })
  completedTasks!: number;

  @ApiProperty({
    description:
      'Percentage of completed tasks (0 to 100), rounded to 2 decimal places',
    example: 50,
  })
  taskCompletionRate!: number;
}
