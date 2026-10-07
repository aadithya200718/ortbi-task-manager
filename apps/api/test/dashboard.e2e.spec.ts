import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('Dashboard Management Integration Tests (Phase 6)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userA = {
    fullName: 'Dashboard User A',
    email: 'dash-user-a@example.com',
    password: 'Password123!',
  };

  const userB = {
    fullName: 'Dashboard User B',
    email: 'dash-user-b@example.com',
    password: 'Password123!',
  };

  let tokenA = '';
  let userAId = '';
  let tokenB = '';
  let userBId = '';

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

  describe('A. Authentication & Security', () => {
    it('should reject GET /api/dashboard without token (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject GET /api/dashboard with malformed token (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer invalid.malformed.token')
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid or malformed authentication token');
    });
  });

  describe('B. Empty State Handling', () => {
    it('should return all zeros and 0% completion rate for user with no resources (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body).toEqual({
        totalProjects: 0,
        projectsNotStarted: 0,
        projectsInProgress: 0,
        projectsCompleted: 0,
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        taskCompletionRate: 0,
      });
    });
  });

  describe('C. Project & Task Statistics with Reconciliation', () => {
    let projNotStartedId = '';
    let projInProgressId = '';
    let projCompletedId = '';

    beforeAll(async () => {
      // Create 3 projects for User A in different statuses
      const p1 = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ name: 'Project Not Started', status: 'NOT_STARTED' });
      projNotStartedId = p1.body.id;

      const p2 = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ name: 'Project In Progress', status: 'IN_PROGRESS' });
      projInProgressId = p2.body.id;

      const p3 = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ name: 'Project Completed', status: 'COMPLETED' });
      projCompletedId = p3.body.id;

      // Create 4 tasks for User A (1 PENDING, 1 IN_PROGRESS, 2 COMPLETED)
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ projectId: projInProgressId, name: 'Task PENDING', status: 'PENDING' });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ projectId: projInProgressId, name: 'Task IN_PROGRESS', status: 'IN_PROGRESS' });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ projectId: projCompletedId, name: 'Task COMPLETED 1', status: 'COMPLETED' });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ projectId: projCompletedId, name: 'Task COMPLETED 2', status: 'COMPLETED' });
    });

    it('should return accurate project statistics and reconcile total', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.totalProjects).toBe(3);
      expect(res.body.projectsNotStarted).toBe(1);
      expect(res.body.projectsInProgress).toBe(1);
      expect(res.body.projectsCompleted).toBe(1);

      // Reconcile
      expect(res.body.totalProjects).toBe(
        res.body.projectsNotStarted +
          res.body.projectsInProgress +
          res.body.projectsCompleted,
      );
    });

    it('should return accurate task statistics, completion rate and reconcile total', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      expect(res.body.totalTasks).toBe(4);
      expect(res.body.pendingTasks).toBe(1);
      expect(res.body.inProgressTasks).toBe(1);
      expect(res.body.completedTasks).toBe(2);

      // 2 completed out of 4 total = 50%
      expect(res.body.taskCompletionRate).toBe(50);

      // Reconcile
      expect(res.body.totalTasks).toBe(
        res.body.pendingTasks +
          res.body.inProgressTasks +
          res.body.completedTasks,
      );
    });
  });

  describe('D. Multi-User Data Isolation', () => {
    beforeAll(async () => {
      // User B creates 1 project and 1 completed task
      const pB = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenB)
        .send({ name: 'User B Only Project', status: 'IN_PROGRESS' });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenB)
        .send({
          projectId: pB.body.id,
          name: 'User B Completed Task',
          status: 'COMPLETED',
        });
    });

    it('should isolate User B dashboard completely from User A resources', async () => {
      const resB = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenB)
        .expect(200);

      expect(resB.body.totalProjects).toBe(1);
      expect(resB.body.projectsInProgress).toBe(1);
      expect(resB.body.totalTasks).toBe(1);
      expect(resB.body.completedTasks).toBe(1);
      expect(resB.body.taskCompletionRate).toBe(100);
    });

    it('should not include User B resources in User A dashboard', async () => {
      const resA = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(200);

      // User A still has 3 projects and 4 tasks
      expect(resA.body.totalProjects).toBe(3);
      expect(resA.body.totalTasks).toBe(4);
    });
  });

  describe('E. Live Consistency Across CRUD Operations', () => {
    let liveProjectId = '';
    let liveTaskId = '';

    it('should reflect new project creation in totalProjects', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      const p = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ name: 'Live Consistency Project', status: 'NOT_STARTED' });
      liveProjectId = p.body.id;

      const after = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      expect(after.body.totalProjects).toBe(before.body.totalProjects + 1);
      expect(after.body.projectsNotStarted).toBe(before.body.projectsNotStarted + 1);
    });

    it('should reflect new task creation in totalTasks', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      const t = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ projectId: liveProjectId, name: 'Live Task', status: 'PENDING' });
      liveTaskId = t.body.id;

      const after = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      expect(after.body.totalTasks).toBe(before.body.totalTasks + 1);
      expect(after.body.pendingTasks).toBe(before.body.pendingTasks + 1);
    });

    it('should reflect task completion in completedTasks and completionRate', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      await request(app.getHttpServer())
        .put('/api/tasks/' + liveTaskId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ status: 'COMPLETED' });

      const after = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      expect(after.body.completedTasks).toBe(before.body.completedTasks + 1);
      expect(after.body.pendingTasks).toBe(before.body.pendingTasks - 1);
      expect(after.body.taskCompletionRate).toBeGreaterThan(before.body.taskCompletionRate);
    });

    it('should reflect task reopening in completedTasks', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      await request(app.getHttpServer())
        .put('/api/tasks/' + liveTaskId)
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ status: 'IN_PROGRESS' });

      const after = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      expect(after.body.completedTasks).toBe(before.body.completedTasks - 1);
      expect(after.body.inProgressTasks).toBe(before.body.inProgressTasks + 1);
    });

    it('should reflect task deletion in totalTasks', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      await request(app.getHttpServer())
        .delete('/api/tasks/' + liveTaskId)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(204);

      const after = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      expect(after.body.totalTasks).toBe(before.body.totalTasks - 1);
    });

    it('should reflect project cascade deletion in both project and task totals', async () => {
      // Create a temporary project with 2 tasks
      const p = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ name: 'Cascade Parent', status: 'IN_PROGRESS' });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ projectId: p.body.id, name: 'Cascade Task A', status: 'COMPLETED' });
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + tokenA)
        .send({ projectId: p.body.id, name: 'Cascade Task B', status: 'PENDING' });

      const beforeDelete = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      // Delete parent project
      await request(app.getHttpServer())
        .delete('/api/projects/' + p.body.id)
        .set('Authorization', 'Bearer ' + tokenA)
        .expect(204);

      const afterDelete = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + tokenA);

      expect(afterDelete.body.totalProjects).toBe(beforeDelete.body.totalProjects - 1);
      expect(afterDelete.body.totalTasks).toBe(beforeDelete.body.totalTasks - 2);
    });
  });

  describe('F. Edge Cases & Rounding', () => {
    let edgeUserToken = '';

    beforeAll(async () => {
      const edgeUserRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Edge Case User',
          email: 'edge-dash-user@example.com',
          password: 'Password123!',
        });
      edgeUserToken = edgeUserRes.body.accessToken;

      const p = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + edgeUserToken)
        .send({ name: 'Edge Project', status: 'IN_PROGRESS' });

      // Create 3 tasks: 1 completed, 2 pending -> 1/3 = 33.33%
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + edgeUserToken)
        .send({ projectId: p.body.id, name: 'T1', status: 'COMPLETED' });
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + edgeUserToken)
        .send({ projectId: p.body.id, name: 'T2', status: 'PENDING' });
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', 'Bearer ' + edgeUserToken)
        .send({ projectId: p.body.id, name: 'T3', status: 'PENDING' });
    });

    afterAll(async () => {
      if (prisma) {
        await prisma.user.deleteMany({
          where: { email: 'edge-dash-user@example.com' },
        });
      }
    });

    it('should round completion rate to 2 decimal places (33.33%)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer ' + edgeUserToken)
        .expect(200);

      expect(res.body.totalTasks).toBe(3);
      expect(res.body.completedTasks).toBe(1);
      expect(res.body.taskCompletionRate).toBe(33.33);
    });
  });
});
