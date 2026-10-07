import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Task, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { parseDateOnly } from '../projects/utils/date.util';

export interface PaginatedTasksResponse {
  items: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const status = dto.status ?? TaskStatus.PENDING;
    const completedAt = status === TaskStatus.COMPLETED ? new Date() : null;
    const dueDate = dto.dueDate ? parseDateOnly(dto.dueDate) : null;

    try {
      // Connect parent project constrained by both projectId and userId (Repair 4 ? F3)
      return await this.prisma.task.create({
        data: {
          project: {
            connect: {
              id_userId: {
                id: dto.projectId,
                userId,
              },
            },
          },
          name: dto.name.trim(),
          description: dto.description ?? null,
          priority: dto.priority ?? TaskPriority.MEDIUM,
          status,
          dueDate,
          completedAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2025' || error.code === 'P2003')
      ) {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }

  async findAll(
    userId: string,
    query: TaskQueryDto,
  ): Promise<PaginatedTasksResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const take = limit;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.TaskWhereInput = {
      project: {
        userId,
      },
    };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.search) {
      where.name = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'desc' }],
        skip,
        take,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        project: {
          userId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    // Concurrency-safe Serializable transaction with bounded retries (Repair 5 ? F5)
    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const existing = await tx.task.findFirst({
              where: {
                id,
                project: {
                  userId,
                },
              },
            });

            if (!existing) {
              throw new NotFoundException('Task not found');
            }

            let completedAt = existing.completedAt;
            if (dto.status !== undefined) {
              if (
                dto.status === TaskStatus.COMPLETED &&
                existing.status !== TaskStatus.COMPLETED
              ) {
                completedAt = new Date();
              } else if (
                dto.status !== TaskStatus.COMPLETED &&
                existing.status === TaskStatus.COMPLETED
              ) {
                completedAt = null;
              } else if (
                dto.status === TaskStatus.COMPLETED &&
                existing.status === TaskStatus.COMPLETED
              ) {
                completedAt = existing.completedAt;
              }
            }

            const data: Prisma.TaskUpdateInput = {};

            if (typeof dto.name === 'string') {
              data.name = dto.name.trim();
            }
            if (dto.description !== undefined) {
              data.description = dto.description;
            }
            if (dto.priority !== undefined) {
              data.priority = dto.priority;
            }
            if (dto.status !== undefined) {
              data.status = dto.status;
              data.completedAt = completedAt;
            }
            if (dto.dueDate !== undefined) {
              data.dueDate = dto.dueDate ? parseDateOnly(dto.dueDate) : null;
            }

            // Ownership enforced in the final database mutation
            const updated = await tx.task.updateManyAndReturn({
              where: {
                id,
                project: {
                  userId,
                },
              },
              data,
            });

            if (updated.length === 0) {
              throw new NotFoundException('Task not found');
            }

            return updated[0];
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Task not found');
        }

        const isSerializationConflict =
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034') ||
          (error instanceof Error &&
            error.message.includes(
              'could not serialize access due to read/write dependencies',
            ));

        if (isSerializationConflict) {
          if (attempt < MAX_TRANSACTION_RETRIES) {
            await new Promise((resolve) =>
              setTimeout(resolve, attempt * 25),
            );
            continue;
          }
          throw new ConflictException(
            'Task was modified concurrently. Please retry your request.',
          );
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Task was modified concurrently. Please retry your request.',
    );
  }

  async delete(userId: string, id: string): Promise<void> {
    // Ownership enforced in the final database mutation
    const result = await this.prisma.task.deleteMany({
      where: {
        id,
        project: {
          userId,
        },
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }
  }
}
