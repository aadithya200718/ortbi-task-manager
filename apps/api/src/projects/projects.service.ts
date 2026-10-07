import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { parseDateOnly } from './utils/date.util';

export interface PaginatedProjectsResponse {
  items: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const startDate = dto.startDate ? parseDateOnly(dto.startDate) : null;
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : null;

    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate cannot be earlier than startDate');
    }

    return this.prisma.project.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description ?? null,
        status: dto.status ?? ProjectStatus.NOT_STARTED,
        startDate,
        endDate,
      },
    });
  }

  async findAll(
    userId: string,
    query: ProjectQueryDto,
  ): Promise<PaginatedProjectsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const take = limit;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.ProjectWhereInput = {
      userId,
    };

    if (query.search) {
      where.name = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      { id: 'desc' },
    ];

    const [total, items] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy,
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

  async findById(userId: string, id: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const existing = await tx.project.findFirst({
              where: {
                id,
                userId,
              },
            });

            if (!existing) {
              throw new NotFoundException('Project not found');
            }

            const effectiveStartDate =
              dto.startDate !== undefined
                ? dto.startDate
                  ? parseDateOnly(dto.startDate)
                  : null
                : existing.startDate;

            const effectiveEndDate =
              dto.endDate !== undefined
                ? dto.endDate
                  ? parseDateOnly(dto.endDate)
                  : null
                : existing.endDate;

            if (
              effectiveStartDate &&
              effectiveEndDate &&
              effectiveEndDate.getTime() < effectiveStartDate.getTime()
            ) {
              throw new BadRequestException(
                'endDate cannot be earlier than startDate',
              );
            }

            const data: Prisma.ProjectUpdateInput = {};

            if (typeof dto.name === 'string') {
              data.name = dto.name.trim();
            }
            if (dto.description !== undefined) {
              data.description = dto.description;
            }
            if (dto.status !== undefined) {
              data.status = dto.status;
            }
            if (dto.startDate !== undefined) {
              data.startDate = dto.startDate
                ? parseDateOnly(dto.startDate)
                : null;
            }
            if (dto.endDate !== undefined) {
              data.endDate = dto.endDate ? parseDateOnly(dto.endDate) : null;
            }

            const updated = await tx.project.updateManyAndReturn({
              where: {
                id,
                userId,
              },
              data,
            });

            if (updated.length === 0) {
              throw new NotFoundException('Project not found');
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
          throw new NotFoundException('Project not found');
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
            // Exponential backoff before retry: 25ms, 50ms, etc.
            await new Promise((resolve) =>
              setTimeout(resolve, attempt * 25),
            );
            continue;
          }
          throw new ConflictException(
            'Project was modified concurrently. Please retry your request.',
          );
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Project was modified concurrently. Please retry your request.',
    );
  }

  async delete(userId: string, id: string): Promise<void> {
    try {
      const result = await this.prisma.project.deleteMany({
        where: {
          id,
          userId,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Project not found');
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }
}
