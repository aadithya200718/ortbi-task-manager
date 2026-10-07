import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('Task Management Integration Tests (Phase 5)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userA = {
    fullName: 'Task User A',
    email: 'task-user-a@example.com',
    password: 'Password123!',
  };

  const userB = {
    fullName: 'Task User B',
    email: 'task-user-b@example.com',
    password: 'Password123!',
  };

  let tokenA = '';
  let userAId = '';
  let tokenB = '';
  let userBId = '';

  let projectAId = '';
  let projectBId = '';
  let createdTaskAId = '';

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

    // Clean up previous test users and cascade-related data
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

    // Create Project for User A
    const projResA = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', 'Bearer ' + tokenA)
      .send({
        name: 'Project A for Tasks',
        status: 'IN_PROGRESS',
      })
      .expect(201);
    projectAId = projResA.body.id;

    // Create Project for User B
    const projResB = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', 'Bearer ' + tokenB)
      .send({
        name: 'Project B for Tasks',
        status: 'IN_PROGRESS',
      })
      .expect(201);
    projectBId = projResB.body.id;
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
    it('should reject GET /api/tasks without token (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks')
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject POST /api/tasks with malformed token (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer invalid.malformed.token')
        .send({ name: 'Hack Task', projectId: projectAId })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid or malformed authentication token');
    });

    it('should reject GET /api/tasks/:id without token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/tasks/55e79b27-9ce7-4480-98cf-db44fc9c4dc9')
        .expect(401);
    });

    it('should reject PUT /api/tasks/:id without token (401)', async () => {
      await request(app.getHttpServer())
        .put('/api/tasks/55e79b27-9ce7-4480-98cf-db44fc9c4dc9')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should reject DELETE /api/tasks/:id without token (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/tasks/55e79b27-9ce7-4480-98cf-db44fc9c4dc9')
        .expect(401);
    });
  });

  describe('B. Task Creation & Ownership Verification', () => {
    it('should create task under project owned by authenticated user (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Implement Task API',
          description: 'Create authenticated task endpoints',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: '2026-10-09',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.projectId).toBe(projectAId);
      expect(res.body.name).toBe('Implement Task API');
      expect(res.body.description).toBe('Create authenticated task endpoints');
      expect(res.body.priority).toBe('HIGH');
      expect(res.body.status).toBe('IN_PROGRESS');
      expect(res.body.dueDate).toContain('2026-10-09');
      expect(res.body.completedAt).toBeNull();
      expect(res.body.createdAt).toBeDefined();

      createdTaskAId = res.body.id;
    });

    it('should reject creating task in a foreign project owned by User B (404)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectBId,
          name: 'Unauthorized Task In Project B',
        })
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('Project not found');
    });

    it('should reject creating task with nonexistent project UUID (404)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: '00000000-0000-0000-0000-000000000000',
          name: 'Task In Nonexistent Project',
        })
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('Project not found');
    });

    it('should apply default priority (MEDIUM) and status (PENDING) when omitted (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Default Priority and Status Task',
        })
        .expect(201);

      expect(res.body.priority).toBe('MEDIUM');
      expect(res.body.status).toBe('PENDING');
      expect(res.body.completedAt).toBeNull();
    });

    it('should set completedAt when creating a task with status COMPLETED (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Initially Completed Task',
          status: 'COMPLETED',
        })
        .expect(201);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should reject missing task name (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
        })
        .expect(400);
    });

    it('should reject empty or whitespace-only task name (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: '   ',
        })
        .expect(400);
    });

    it('should reject name exceeding 255 characters (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'T'.repeat(256),
        })
        .expect(400);
    });

    it('should reject invalid priority (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Invalid Priority Task',
          priority: 'URGENT_NOT_VALID',
        })
        .expect(400);
    });

    it('should reject invalid status (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Invalid Status Task',
          status: 'BLOCKED',
        })
        .expect(400);
    });

    it('should reject impossible calendar due date (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Impossible Due Date Task',
          dueDate: '2026-02-30',
        })
        .expect(400);
    });

    it('should reject client-supplied userId (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Spoofed User Task',
          userId: userBId,
        })
        .expect(400);
    });

    it('should reject client-supplied completedAt (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Forged Completion Task',
          completedAt: '2026-01-01T00:00:00.000Z',
        })
        .expect(400);
    });
  });

  describe('C. Task Details & IDOR Relational Protection', () => {
    it('should allow owner (User A) to retrieve their task (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.id).toBe(createdTaskAId);
      expect(res.body.name).toBe('Implement Task API');
      expect(res.body.projectId).toBe(projectAId);
    });

    it('should reject non-owner (User B) access to User A task with 404 (IDOR Protection)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenB)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('Task not found');
    });

    it('should return 404 for nonexistent task UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
    });

    it('should return safe 400 client error for malformed UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks/not-a-valid-uuid')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('D. Task Listing, Searching, Filtering, Sorting & Pagination', () => {
    beforeAll(async () => {
      // Create additional tasks for User A
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Alpha Searchable Task',
          priority: 'LOW',
          status: 'PENDING',
          dueDate: '2026-10-20',
        });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Beta Completed Task',
          priority: 'HIGH',
          status: 'COMPLETED',
          dueDate: '2026-10-05',
        });

      // Create task for User B in User B project
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenB)
        .send({
          projectId: projectBId,
          name: 'User B Private Task',
          priority: 'HIGH',
          status: 'PENDING',
        });
    });

    it('should return only tasks from projects owned by User A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBe(true);

      const hasUserBTask = res.body.items.some(
        (t: { name: string }) => t.name === 'User B Private Task',
      );
      expect(hasUserBTask).toBe(false);

      const allBelongToProjectA = res.body.items.every(
        (t: { projectId: string }) => t.projectId === projectAId,
      );
      expect(allBelongToProjectA).toBe(true);
    });

    it('should return only tasks from projects owned by User B', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenB)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('User B Private Task');
    });

    it('should filter tasks by projectId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks?projectId=' + projectAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter tasks by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks?status=COMPLETED')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      const allCompleted = res.body.items.every(
        (t: { status: string }) => t.status === 'COMPLETED',
      );
      expect(allCompleted).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks?priority=LOW')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Alpha Searchable Task');
    });

    it('should perform case-insensitive search by task name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks?search=ALPHA')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Alpha Searchable Task');
    });

    it('should combine multiple filters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks?projectId=' + projectAId + '&status=PENDING&priority=LOW')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Alpha Searchable Task');
    });

    it('should support pagination metadata contract', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.items.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
      expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should sort tasks deterministically', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks?sortBy=name&sortOrder=asc')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      const names = res.body.items.map((t: { name: string }) => t.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    });

    it('should reject unwhitelisted sort fields (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/tasks?sortBy=invalidField')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(400);
    });
  });

  describe('E. Task Editing & Completion Lifecycle Transitions', () => {
    it('should allow owner (User A) to update task details (200)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Implement Task API (Updated)',
          description: 'Updated description',
          priority: 'LOW',
        })
        .expect(200);

      expect(res.body.name).toBe('Implement Task API (Updated)');
      expect(res.body.description).toBe('Updated description');
      expect(res.body.priority).toBe('LOW');
      expect(res.body.status).toBe('IN_PROGRESS'); // Preserved
    });

    it('should set completedAt when transitioning status to COMPLETED (200)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          status: 'COMPLETED',
        })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should preserve original completedAt when editing a completed task without status change (200)', async () => {
      // Fetch current completedAt
      const current = await request(app.getHttpServer())
        .get('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      const originalCompletedAt = current.body.completedAt;

      // Update name only
      const res = await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          name: 'Renamed Completed Task',
        })
        .expect(200);

      expect(res.body.name).toBe('Renamed Completed Task');
      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.completedAt).toBe(originalCompletedAt);
    });

    it('should clear completedAt when reopening a completed task (status becomes IN_PROGRESS) (200)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200);

      expect(res.body.status).toBe('IN_PROGRESS');
      expect(res.body.completedAt).toBeNull();
    });

    it('should reject non-owner (User B) updating User A task with 404 (IDOR Protection)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenB)
        .send({
          name: 'Hacked Task Name',
        })
        .expect(404);

      expect(res.body.message).toBe('Task not found');
    });

    it('should reject attempting to reassign projectId on update (400)', async () => {
      await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectBId,
        })
        .expect(400);
    });

    it('should reject client-supplied userId on update (400)', async () => {
      await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          userId: userBId,
        })
        .expect(400);
    });

    it('should reject client-supplied completedAt on update (400)', async () => {
      await request(app.getHttpServer())
        .put('/api/tasks/' + createdTaskAId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          completedAt: '2026-01-01T00:00:00.000Z',
        })
        .expect(400);
    });
  });

  describe('F. Task Deletion & Database Cascade Behavior', () => {
    let taskToDeleteId = '';

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({
          projectId: projectAId,
          name: 'Task To Delete',
        });
      taskToDeleteId = res.body.id;
    });

    it('should reject non-owner (User B) deleting User A task with 404 (IDOR Protection)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/tasks/' + taskToDeleteId)
        .set('Authorization', 'Bearer ' + tokenB)
        .expect(404);

      expect(res.body.message).toBe('Task not found');
    });

    it('should allow owner (User A) to delete task (204)', async () => {
      await request(app.getHttpServer())
        .delete('/api/tasks/' + taskToDeleteId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(204);

      // Verify task no longer exists
      const dbTask = await prisma.task.findUnique({
        where: { id: taskToDeleteId },
      });
      expect(dbTask).toBeNull();
    });

    it('should return 404 when fetching deleted task', async () => {
      await request(app.getHttpServer())
        .delete('/api/tasks/' + taskToDeleteId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(204);

      await request(app.getHttpServer())
        .get('/api/tasks/' + taskToDeleteId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(404);
    });

    it('should verify project deletion cascades and removes all dependent tasks', async () => {
      // Create a temporary project with multiple tasks
      const tempProj = await prisma.project.create({
        data: {
          userId: userAId,
          name: 'Cascade Project Temp',
        },
      });

      const t1 = await prisma.task.create({
        data: {
          projectId: tempProj.id,
          name: 'Cascade Task 1',
        },
      });
      const t2 = await prisma.task.create({
        data: {
          projectId: tempProj.id,
          name: 'Cascade Task 2',
        },
      });

      // Delete the parent project via DELETE /api/projects/:id
      await request(app.getHttpServer())
        .delete('/api/projects/' + tempProj.id)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(204);

      // Verify tasks are cascade deleted from PostgreSQL
      const foundT1 = await prisma.task.findUnique({ where: { id: t1.id } });
      const foundT2 = await prisma.task.findUnique({ where: { id: t2.id } });
      expect(foundT1).toBeNull();
      expect(foundT2).toBeNull();
    });
  });
});
