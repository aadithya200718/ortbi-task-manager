import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProjectsService } from '../src/projects/projects.service';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('Project Management Integration Tests (Phase 4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userA = {
    fullName: 'User A Projects',
    email: 'user-a-proj@example.com',
    password: 'Password123!',
  };

  const userB = {
    fullName: 'User B Projects',
    email: 'user-b-proj@example.com',
    password: 'Password123!',
  };

  let tokenA = '';
  let userAId = '';
  let tokenB = '';
  let userBId = '';

  let createdProjectAId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    prisma = app.get(PrismaService);

    // Clean up previous test users and projects
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email] },
      },
    });

    // Register User A
    const regResA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userA)
      .expect(201);
    tokenA = regResA.body.accessToken;
    userAId = regResA.body.user.id;

    // Register User B
    const regResB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userB)
      .expect(201);
    tokenB = regResB.body.accessToken;
    userBId = regResB.body.user.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: { in: [userA.email, userB.email] },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  describe('A. Authentication & Route Protection', () => {
    it('should reject GET /api/projects without token (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject POST /api/projects with invalid/malformed token (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer invalid.malformed.token')
        .send({ name: 'Hack Project' })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid or malformed authentication token');
    });

    it('should reject GET /api/projects/:id without token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/55e79b27-9ce7-4480-98cf-db44fc9c4dc9')
        .expect(401);
    });

    it('should reject PUT /api/projects/:id without token (401)', async () => {
      await request(app.getHttpServer())
        .put('/api/projects/55e79b27-9ce7-4480-98cf-db44fc9c4dc9')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should reject DELETE /api/projects/:id without token (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/projects/55e79b27-9ce7-4480-98cf-db44fc9c4dc9')
        .expect(401);
    });
  });

  describe('B. Project Creation & Validation', () => {
    it('should successfully create a project for authenticated user (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'ISMO Assessment',
          description: 'Full Stack Developer assessment project',
          status: 'IN_PROGRESS',
          startDate: '2026-10-07',
          endDate: '2026-10-10',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.userId).toBe(userAId);
      expect(res.body.name).toBe('ISMO Assessment');
      expect(res.body.description).toBe('Full Stack Developer assessment project');
      expect(res.body.status).toBe('IN_PROGRESS');
      expect(res.body.startDate).toContain('2026-10-07');
      expect(res.body.endDate).toContain('2026-10-10');
      expect(res.body.createdAt).toBeDefined();

      createdProjectAId = res.body.id;
    });

    it('should default status to NOT_STARTED when omitted (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Default Status Project',
        })
        .expect(201);

      expect(res.body.status).toBe('NOT_STARTED');
    });

    it('should trim whitespace from project name (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: '   Trimmed Project Name   ',
        })
        .expect(201);

      expect(res.body.name).toBe('Trimmed Project Name');
    });

    it('should reject empty or whitespace-only name (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: '   ',
        })
        .expect(400);
    });

    it('should reject name exceeding 255 characters (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'A'.repeat(256),
        })
        .expect(400);
    });

    it('should reject invalid status (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Invalid Status Project',
          status: 'RANDOM_STATUS',
        })
        .expect(400);
    });

    it('should reject impossible calendar date (400)', async () => {
      // 2026-02-30 does not exist
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Impossible Date Project',
          startDate: '2026-02-30',
        })
        .expect(400);
    });

    it('should reject malformed date format (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Malformed Date Project',
          startDate: '07-10-2026',
        })
        .expect(400);
    });

    it('should reject endDate before startDate (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Invalid Date Range Project',
          startDate: '2026-10-10',
          endDate: '2026-10-05',
        })
        .expect(400);

      expect(JSON.stringify(res.body)).toContain('endDate cannot be earlier than startDate');
    });

    it('should reject client-supplied userId (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Spoofed User Project',
          userId: userBId,
        })
        .expect(400);
    });
  });

  describe('C. Project Details & IDOR Protection', () => {
    it('should allow owner (User A) to retrieve project details (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/' + createdProjectAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.id).toBe(createdProjectAId);
      expect(res.body.userId).toBe(userAId);
      expect(res.body.name).toBe('ISMO Assessment');
    });

    it('should reject non-owner (User B) access to User A project with 404 (IDOR Protection)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/' + createdProjectAId)
        .set('Authorization', 'Bearer ' + tokenB)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('Project not found');
    });

    it('should return 404 for nonexistent project UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
    });

    it('should return safe 400 client error for malformed UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/not-a-valid-uuid')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('D. Search, Filtering, Pagination & Sorting', () => {
    beforeAll(async () => {
      // Create additional projects for User A
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Alpha Backend API',
          status: 'IN_PROGRESS',
          startDate: '2026-10-01',
          endDate: '2026-10-15',
        });

      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Beta Mobile Suite',
          status: 'COMPLETED',
          startDate: '2026-09-01',
          endDate: '2026-09-30',
        });

      // Create a project for User B
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenB)
        .send({
          name: 'User B Secret Project',
          status: 'IN_PROGRESS',
        });
    });

    it('should return only User A projects when User A lists projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.pagination).toBeDefined();

      const userBProjects = res.body.items.filter(
        (p: { userId: string }) => p.userId === userBId,
      );
      expect(userBProjects.length).toBe(0);

      const allOwnedByA = res.body.items.every(
        (p: { userId: string }) => p.userId === userAId,
      );
      expect(allOwnedByA).toBe(true);
    });

    it('should return only User B projects when User B lists projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', 'Bearer ' + tokenB)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('User B Secret Project');
      expect(res.body.items[0].userId).toBe(userBId);
    });

    it('should support case-insensitive search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects?search=ALPHA')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Alpha Backend API');
    });

    it('should filter by project status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects?status=COMPLETED')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Beta Mobile Suite');
      expect(res.body.items[0].status).toBe('COMPLETED');
    });

    it('should combine search and status filters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects?search=Alpha&status=IN_PROGRESS')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Alpha Backend API');
    });

    it('should support pagination metadata contract', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects?page=1&limit=2')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(4);
      expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should sort projects by name in ascending order', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects?sortBy=name&sortOrder=asc')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      const names = res.body.items.map((p: { name: string }) => p.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    });

    it('should reject unwhitelisted sort fields (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/projects?sortBy=maliciousField')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(400);
    });
  });

  describe('E. Project Editing & Authorization', () => {
    it('should allow owner (User A) to update project (200)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/projects/' + createdProjectAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'ISMO Assessment Updated',
          description: 'Updated description',
          status: 'COMPLETED',
        })
        .expect(200);

      expect(res.body.name).toBe('ISMO Assessment Updated');
      expect(res.body.description).toBe('Updated description');
      expect(res.body.status).toBe('COMPLETED');
      // Preserves existing dates
      expect(res.body.startDate).toContain('2026-10-07');
      expect(res.body.endDate).toContain('2026-10-10');
    });

    it('should reject non-owner (User B) updating User A project with 404 (IDOR Protection)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/projects/' + createdProjectAId)
        .set('Authorization', 'Bearer ' + tokenB)
        .send({
          name: 'Hacked Name',
        })
        .expect(404);

      expect(res.body.message).toBe('Project not found');
    });

    it('should reject invalid status during update (400)', async () => {
      await request(app.getHttpServer())
        .put('/api/projects/' + createdProjectAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });

    it('should reject updating endDate to earlier than stored startDate (400)', async () => {
      // Stored startDate is 2026-10-07
      const res = await request(app.getHttpServer())
        .put('/api/projects/' + createdProjectAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          endDate: '2026-10-01',
        })
        .expect(400);

      expect(JSON.stringify(res.body)).toContain('endDate cannot be earlier than startDate');
    });

    it('should reject attempting to reassign userId during update (400)', async () => {
      await request(app.getHttpServer())
        .put('/api/projects/' + createdProjectAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          userId: userBId,
        })
        .expect(400);
    });
  });

  describe('F. Project Deletion, Ownership & Cascades', () => {
    let cascadeProjectId = '';
    let cascadeTaskId = '';

    beforeAll(async () => {
      // Create a project with a dependent task
      const project = await prisma.project.create({
        data: {
          userId: userAId,
          name: 'Cascade Test Project',
          status: 'NOT_STARTED',
        },
      });
      cascadeProjectId = project.id;

      const task = await prisma.task.create({
        data: {
          projectId: cascadeProjectId,
          name: 'Dependent Task 1',
          status: 'PENDING',
          priority: 'HIGH',
        },
      });
      cascadeTaskId = task.id;
    });

    it('should reject non-owner (User B) deleting User A project with 404 (IDOR Protection)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/projects/' + cascadeProjectId)
        .set('Authorization', 'Bearer ' + tokenB)
        .expect(404);

      expect(res.body.message).toBe('Project not found');
    });

    it('should allow owner (User A) to delete project (204) and cascade-delete tasks', async () => {
      await request(app.getHttpServer())
        .delete('/api/projects/' + cascadeProjectId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(204);

      // Verify project is deleted
      const dbProject = await prisma.project.findUnique({
        where: { id: cascadeProjectId },
      });
      expect(dbProject).toBeNull();

      // Verify cascade task is deleted
      const dbTask = await prisma.task.findUnique({
        where: { id: cascadeTaskId },
      });
      expect(dbTask).toBeNull();
    });

    it('should return 404 when fetching deleted project', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/' + cascadeProjectId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(404);
    });
  });

  describe('G. Serializable Transaction Isolation & Retry Protection', () => {
    let concurrentProjectId = '';

    beforeEach(async () => {
      const p = await prisma.project.create({
        data: {
          userId: userAId,
          name: 'Concurrent Date Test Project',
          startDate: new Date(Date.UTC(2026, 9, 1)),
          endDate: new Date(Date.UTC(2026, 9, 31)),
        },
      });
      concurrentProjectId = p.id;
    });

    afterEach(async () => {
      if (concurrentProjectId) {
        await prisma.project.deleteMany({
          where: { id: concurrentProjectId },
        });
      }
    });

    it('should maintain date-range invariant under concurrent conflicting date updates', async () => {
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .put('/api/projects/' + concurrentProjectId)
          .set('Authorization', 'Bearer ' + tokenA)
          .send({ startDate: '2026-10-25' }),
        request(app.getHttpServer())
          .put('/api/projects/' + concurrentProjectId)
          .set('Authorization', 'Bearer ' + tokenA)
          .send({ endDate: '2026-10-15' }),
      ]);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(200);

      const finalProject = await prisma.project.findUnique({
        where: { id: concurrentProjectId },
      });
      expect(finalProject).not.toBeNull();
      if (finalProject?.startDate && finalProject?.endDate) {
        expect(finalProject.endDate.getTime()).toBeGreaterThanOrEqual(
          finalProject.startDate.getTime(),
        );
      }
    });

    it('should retry transaction upon encountering P2034 conflict and succeed if conflict resolves', async () => {
      const projectsService = app.get(ProjectsService);
      let attempts = 0;
      const realTransaction = prisma.$transaction.bind(prisma);

      jest.spyOn(prisma, '$transaction').mockImplementation(async (fn: any, options: any) => {
        attempts++;
        if (attempts === 1) {
          throw new Prisma.PrismaClientKnownRequestError(
            'Transaction failed due to a write conflict or a deadlock',
            { code: 'P2034', clientVersion: '6.19.3' },
          );
        }
        return realTransaction(fn, options);
      });

      const updated = await projectsService.update(userAId, concurrentProjectId, {
        name: 'Retry Success Project',
      });

      expect(attempts).toBe(2);
      expect(updated.name).toBe('Retry Success Project');
      jest.restoreAllMocks();
    });

    it('should exhaust 3 retries and return clean 409 ConflictException when P2034 persists', async () => {
      const projectsService = app.get(ProjectsService);
      let attempts = 0;

      jest.spyOn(prisma, '$transaction').mockImplementation(async () => {
        attempts++;
        throw new Prisma.PrismaClientKnownRequestError(
          'Transaction failed due to a write conflict or a deadlock',
          { code: 'P2034', clientVersion: '6.19.3' },
        );
      });

      await expect(
        projectsService.update(userAId, concurrentProjectId, {
          name: 'Retry Exhaust Project',
        }),
      ).rejects.toThrow('Project was modified concurrently. Please retry your request.');

      expect(attempts).toBe(3);
      jest.restoreAllMocks();
    });
  });
});
