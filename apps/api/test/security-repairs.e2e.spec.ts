import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { validateJwtExpiresIn } from '../src/auth/utils/jwt-expires-in.validator';

jest.setTimeout(30000);

describe('Post-Codex Security Repairs (F1-F5, F7-F9)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUserA = {
    fullName: 'Repair User A',
    email: 'repair-user-a@example.com',
    password: 'SecurePassword123!',
  };

  const testUserB = {
    fullName: 'Repair User B',
    email: 'repair-user-b@example.com',
    password: 'SecurePassword123!',
  };

  let tokenA = '';
  let userAId = '';
  let tokenB = '';
  let userBId = '';

  beforeAll(async () => {
    // F9 Isolation Check: Fail closed if not running on test database
    const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    expect(dbUrl).toBeDefined();
    expect(dbUrl).toContain('orbit_test');
    expect(dbUrl).not.toContain('orbit_dev');

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

    // Clean up any existing test fixtures in orbit_test
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            testUserA.email,
            testUserB.email,
            'unicode72@example.com',
            'overlong@example.com',
            'emojiover@example.com',
          ],
        },
      },
    });

    // Register User A
    const resA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUserA)
      .expect(201);
    tokenA = resA.body.accessToken;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUserB)
      .expect(201);
    tokenB = resB.body.accessToken;
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              testUserA.email,
              testUserB.email,
              'unicode72@example.com',
              'overlong@example.com',
              'emojiover@example.com',
            ],
          },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  // =========================================================================
  // F9: TEST DATABASE ISOLATION VERIFICATION
  // =========================================================================
  describe('F9: Dedicated Test Database Isolation', () => {
    it('executes against orbit_test and leaves orbit_dev completely isolated', async () => {
      expect(process.env.TEST_DATABASE_URL).toContain('orbit_test');
      expect(process.env.DATABASE_URL).toContain('orbit_test');
    });
  });

  // =========================================================================
  // F1: ENFORCE BCRYPT 72-BYTE LIMIT & UNICODE HANDLING
  // =========================================================================
  describe('F1: bcrypt 72 UTF-8 Byte Limit', () => {
    it('rejects registration with ASCII password exceeding 72 bytes (73 chars) with HTTP 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Overlong User',
          email: 'overlong@example.com',
          password: 'A'.repeat(73),
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with multibyte Unicode exceeding 72 UTF-8 bytes (19 4-byte emojis = 76 bytes) with HTTP 400', async () => {
      // 19 emojis * 4 bytes each = 76 UTF-8 bytes (character length is 38)
      const emojiPassword = '\u{1F680}'.repeat(19);
      expect(Buffer.byteLength(emojiPassword, 'utf8')).toBe(76);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Emoji Over User',
          email: 'emojiover@example.com',
          password: emojiPassword,
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('accepts registration with multibyte Unicode exactly 72 UTF-8 bytes (18 4-byte emojis = 72 bytes) and allows login', async () => {
      // 18 emojis * 4 bytes each = 72 UTF-8 bytes
      const emojiPassword = '\u{1F680}'.repeat(18);
      expect(Buffer.byteLength(emojiPassword, 'utf8')).toBe(72);

      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Unicode 72 User',
          email: 'unicode72@example.com',
          password: emojiPassword,
        })
        .expect(201);

      expect(regRes.body.user.email).toBe('unicode72@example.com');
      expect(regRes.body.accessToken).toBeDefined();

      // Verify login works with this exact password
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'unicode72@example.com',
          password: emojiPassword,
        })
        .expect(200);

      expect(loginRes.body.accessToken).toBeDefined();
    });

    it('rejects login with password exceeding 72 UTF-8 bytes (exact 72-byte prefix + suffix) with HTTP 400', async () => {
      // 18 emojis = 72 bytes. Add 1 ASCII character 'a' -> 73 UTF-8 bytes
      const valid72 = '\u{1F680}'.repeat(18);
      const over72 = valid72 + 'a';
      expect(Buffer.byteLength(over72, 'utf8')).toBe(73);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'unicode72@example.com',
          password: over72,
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects login with multibyte Unicode password exceeding 72 UTF-8 bytes with HTTP 400', async () => {
      const emojiPassword = '\u{1F680}'.repeat(19); // 76 bytes
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'unicode72@example.com',
          password: emojiPassword,
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // F4: REJECT INVALID NULL UPDATES
  // =========================================================================
  describe('F4: Reject Invalid Null Updates', () => {
    let projectId = '';
    let taskId = '';

    beforeAll(async () => {
      const projRes = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'F4 Test Project',
          description: 'Initial description',
          status: 'IN_PROGRESS',
        })
        .expect(201);
      projectId = projRes.body.id;

      const taskRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          projectId,
          name: 'F4 Test Task',
          priority: 'MEDIUM',
          status: 'PENDING',
        })
        .expect(201);
      taskId = taskRes.body.id;
    });

    it('rejects Project update with {"name": null} with HTTP 400', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: null })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects Project update with {"status": null} with HTTP 400', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: null })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects Task update with {"name": null} with HTTP 400', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: null })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects Task update with {"priority": null} with HTTP 400', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ priority: null })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects Task update with {"status": null} with HTTP 400', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: null })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('preserves intentional clearing of nullable description by allowing null', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: null })
        .expect(200);

      expect(res.body.description).toBeNull();
    });
  });

  // =========================================================================
  // F3: SECURE TASK CREATION AGAINST PARENT DELETION RACES
  // =========================================================================
  describe('F3: Secure Task Creation Nested Relation Connection', () => {
    it('returns HTTP 404 when attempting to create a task for a non-existent projectId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          projectId: '00000000-0000-4000-8000-000000000000',
          name: 'Task with non-existent parent',
        })
        .expect(404);

      expect(res.body.message).toBe('Project not found');
    });

    it('returns HTTP 404 when User B attempts to create a task on User A project', async () => {
      // Create project owned by User A
      const pRes = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'User A Private Project' })
        .expect(201);

      // User B tries to insert task into User A project
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          projectId: pRes.body.id,
          name: 'Unauthorized Cross-User Task',
        })
        .expect(404);

      expect(res.body.message).toBe('Project not found');
    });
  });

  // =========================================================================
  // F5: CORRECT TASK COMPLETION TIMESTAMPS & CONCURRENCY
  // =========================================================================
  describe('F5: Task Completion Timestamps Lifecycle & Concurrency', () => {
    let projectId = '';
    let taskId = '';

    beforeAll(async () => {
      const pRes = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Lifecycle Project' })
        .expect(201);
      projectId = pRes.body.id;

      const tRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          projectId,
          name: 'Lifecycle Task',
          status: 'PENDING',
        })
        .expect(201);
      taskId = tRes.body.id;
      expect(tRes.body.completedAt).toBeNull();
    });

    it('sets completedAt timestamp when transitioning from PENDING to COMPLETED', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('preserves existing completedAt timestamp when status remains COMPLETED', async () => {
      const initial = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const initialTime = initial.body.completedAt;

      // Small delay
      await new Promise((r) => setTimeout(r, 50));

      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'COMPLETED', name: 'Renamed while completed' })
        .expect(200);

      expect(res.body.completedAt).toBe(initialTime);
    });

    it('clears completedAt (sets to null) when reopening task to IN_PROGRESS', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(res.body.status).toBe('IN_PROGRESS');
      expect(res.body.completedAt).toBeNull();
    });

    it('generates a new completedAt timestamp when completing again after reopening', async () => {
      await new Promise((r) => setTimeout(r, 50));
      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.completedAt).not.toBeNull();
    });
    it('handles concurrent status updates safely with Serializable transaction retries', async () => {
      // Create a task for concurrency testing
      const taskRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          projectId,
          name: 'Concurrent Race Task',
          status: 'PENDING',
        })
        .expect(201);
      const raceTaskId = taskRes.body.id;

      // Fire 4 concurrent updates (alternating IN_PROGRESS and COMPLETED)
      const updates = [
        request(app.getHttpServer())
          .put(`/api/tasks/${raceTaskId}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ status: 'IN_PROGRESS' }),
        request(app.getHttpServer())
          .put(`/api/tasks/${raceTaskId}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ status: 'COMPLETED' }),
        request(app.getHttpServer())
          .put(`/api/tasks/${raceTaskId}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ status: 'IN_PROGRESS' }),
        request(app.getHttpServer())
          .put(`/api/tasks/${raceTaskId}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ status: 'COMPLETED' }),
      ];

      const results = await Promise.all(updates);

      // All requests must return HTTP 200 (or HTTP 409 if retries exhausted, but no 500s)
      for (const res of results) {
        expect([200, 409]).toContain(res.status);
      }

      // Final state in PostgreSQL must have completedAt matching final status invariant
      const finalTask = await request(app.getHttpServer())
        .get(`/api/tasks/${raceTaskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      if (finalTask.body.status === 'COMPLETED') {
        expect(finalTask.body.completedAt).not.toBeNull();
      } else {
        expect(finalTask.body.completedAt).toBeNull();
      }
    });
  });

  // =========================================================================
  // F7: SANITIZE ERROR LOGGING
  // =========================================================================
  describe('F7: Error Logging Sanitization', () => {
    it('redacts passwords, tokens, hashes and connection strings from error logs', async () => {
      const errorLogs: string[] = [];
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation((message: any) => {
        errorLogs.push(String(message));
      });

      const syntheticPassword = 'SUPER_SENSITIVE_SECRET_XYZ123';
      const syntheticJwt = [
        Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
        Buffer.from(JSON.stringify({ sub: 'synthetic-test-user' })).toString('base64url'),
        'synthetic-test-signature-segment',
      ].join('.');
      const syntheticDb = 'postgresql://postgres:secret_password@localhost:5433/orbit_dev?schema=public';

      // Send bad request or trigger error filter with sensitive input in message/stack
      const filter = new HttpExceptionFilter();
      const mockHost = {
        switchToHttp: () => ({
          getRequest: () => ({ method: 'POST', url: '/api/test' }),
          getResponse: () => ({
            status: () => ({
              json: () => {},
            }),
          }),
        }),
      } as any;

      const sensitiveError = new Error(
        `Database connection failed: ${syntheticDb} while hashing ${syntheticPassword} for token ${syntheticJwt}`
      );

      filter.catch(sensitiveError, mockHost);

      errorSpy.mockRestore();

      const combinedLog = errorLogs.join(' ');
      expect(combinedLog).not.toContain(syntheticPassword);
      expect(combinedLog).not.toContain(syntheticJwt);
      expect(combinedLog).not.toContain('secret_password');
      expect(combinedLog).toContain('[REDACTED');
    });
  });

  // =========================================================================
  // F8: VALIDATE JWT EXPIRATION CONFIGURATION
  // =========================================================================
  describe('F8: Startup JWT_EXPIRES_IN Validation', () => {
    it('accepts valid duration strings with explicit units ("1h", "15m", "7d", "3600s", "60s", "30d")', () => {
      expect(validateJwtExpiresIn('1h')).toBe('1h');
      expect(validateJwtExpiresIn('15m')).toBe('15m');
      expect(validateJwtExpiresIn('7d')).toBe('7d');
      expect(validateJwtExpiresIn('3600s')).toBe('3600s');
      expect(validateJwtExpiresIn('60s')).toBe('60s');
      expect(validateJwtExpiresIn('30d')).toBe('30d');
    });

    it('rejects unitless duration strings ("3600", "10", "0")', () => {
      expect(() => validateJwtExpiresIn('3600')).toThrow('Unitless duration strings are not permitted');
      expect(() => validateJwtExpiresIn('10')).toThrow('Unitless duration strings are not permitted');
      expect(() => validateJwtExpiresIn('0')).toThrow('Unitless duration strings are not permitted');
    });

    it('rejects missing or empty expiration', () => {
      expect(() => validateJwtExpiresIn(undefined)).toThrow('missing or empty');
      expect(() => validateJwtExpiresIn('')).toThrow('missing or empty');
      expect(() => validateJwtExpiresIn('   ')).toThrow('missing or empty');
    });

    it('rejects invalid or non-duration formats ("invalid", "forever")', () => {
      expect(() => validateJwtExpiresIn('invalid')).toThrow('invalid');
      expect(() => validateJwtExpiresIn('forever')).toThrow('invalid');
    });

    it('rejects durations below minimum 60 seconds policy', () => {
      expect(() => validateJwtExpiresIn('30s')).toThrow('at least 60 seconds');
      expect(() => validateJwtExpiresIn('59s')).toThrow('at least 60 seconds');
    });

    it('rejects durations exceeding maximum 30 days policy', () => {
      expect(() => validateJwtExpiresIn('31d')).toThrow('maximum policy of 30 days');
      expect(() => validateJwtExpiresIn('365d')).toThrow('maximum policy of 30 days');
    });

    it('verifies actual signed JWT claims: exp - iat approximately equals configured duration in seconds (3600s for 1h)', async () => {
      const jwtService = app.get(JwtService);
      const validatedDuration = validateJwtExpiresIn('1h');
      const token = await jwtService.signAsync(
        { sub: userAId, email: testUserA.email },
        { expiresIn: validatedDuration },
      );

      const decoded = jwt.decode(token) as { iat: number; exp: number };
      expect(decoded).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      const durationSeconds = decoded.exp - decoded.iat;
      expect(durationSeconds).toBe(3600);
    });
  });

  // =========================================================================
  // F2: DETERMINISTIC PROJECT PAGINATION
  // =========================================================================
  describe('F2: Deterministic Project Pagination', () => {
    it('produces stable pagination without duplicate or skipped items across pages when sort field is identical', async () => {
      // Create 4 projects with identical name for User B
      const ids: string[] = [];
      for (let i = 1; i <= 4; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/projects')
          .set('Authorization', `Bearer ${tokenB}`)
          .send({ name: 'Identical Name Batch' })
          .expect(201);
        ids.push(res.body.id);
      }

      // Query page 1 (limit 2)
      const page1 = await request(app.getHttpServer())
        .get('/api/projects?search=Identical+Name+Batch&sortBy=name&sortOrder=asc&page=1&limit=2')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      // Query page 2 (limit 2)
      const page2 = await request(app.getHttpServer())
        .get('/api/projects?search=Identical+Name+Batch&sortBy=name&sortOrder=asc&page=2&limit=2')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(page1.body.items).toHaveLength(2);
      expect(page2.body.items).toHaveLength(2);

      const page1Ids = page1.body.items.map((p: any) => p.id);
      const page2Ids = page2.body.items.map((p: any) => p.id);

      // The intersection of IDs between page 1 and page 2 must be empty (no duplicate items)
      const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);

      // Total items across both pages must equal 4
      const combined = [...page1Ids, ...page2Ids];
      expect(new Set(combined).size).toBe(4);
    });
  });
});
