import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<DashboardStatsDto> {
    return await this.prisma.$transaction(
      async (tx) => {
        const [projectGroups, taskGroups] = await Promise.all([
          tx.project.groupBy({
            by: ['status'],
            where: {
              userId,
            },
            _count: {
              _all: true,
            },
          }),
          tx.task.groupBy({
            by: ['status'],
            where: {
              project: {
                userId,
              },
            },
            _count: {
              _all: true,
            },
          }),
        ]);

        let projectsNotStarted = 0;
        let projectsInProgress = 0;
        let projectsCompleted = 0;

        for (const group of projectGroups) {
          if (group.status === ProjectStatus.NOT_STARTED) {
            projectsNotStarted = group._count._all;
          } else if (group.status === ProjectStatus.IN_PROGRESS) {
            projectsInProgress = group._count._all;
          } else if (group.status === ProjectStatus.COMPLETED) {
            projectsCompleted = group._count._all;
          }
        }

        const totalProjects =
          projectsNotStarted + projectsInProgress + projectsCompleted;

        let pendingTasks = 0;
        let inProgressTasks = 0;
        let completedTasks = 0;

        for (const group of taskGroups) {
          if (group.status === TaskStatus.PENDING) {
            pendingTasks = group._count._all;
          } else if (group.status === TaskStatus.IN_PROGRESS) {
            inProgressTasks = group._count._all;
          } else if (group.status === TaskStatus.COMPLETED) {
            completedTasks = group._count._all;
          }
        }

        const totalTasks = pendingTasks + inProgressTasks + completedTasks;

        const taskCompletionRate =
          totalTasks === 0
            ? 0
            : Math.round((completedTasks / totalTasks) * 100 * 100) / 100;

        return {
          totalProjects,
          projectsNotStarted,
          projectsInProgress,
          projectsCompleted,
          totalTasks,
          pendingTasks,
          inProgressTasks,
          completedTasks,
          taskCompletionRate,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }
}
