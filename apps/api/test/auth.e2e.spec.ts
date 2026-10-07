import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { validateJwtSecret } from '../src/auth/utils/jwt-secret.validator';

jest.setTimeout(30000);

describe('Authentication Integration Tests (Phase 3)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    fullName: 'Test User One',
    email: 'TestUser1@Example.COM',
    normalizedEmail: 'testuser1@example.com',
    password: 'SuperSecurePassword123!',
  };

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

    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              testUser.normalizedEmail,
              'duplicate@example.com',
              'validlogin@example.com',
            ],
          },
        },
      });
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              testUser.normalizedEmail,
              'duplicate@example.com',
              'validlogin@example.com',
            ],
          },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  describe('A. User Registration', () => {
    it('should successfully register with normalized email and return safe user + token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: testUser.fullName,
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.fullName).toBe('Test User One');
      expect(res.body.user.email).toBe(testUser.normalizedEmail);
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.createdAt).toBeDefined();

      // Ensure password and passwordHash are NEVER returned
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject duplicate registration with normalized lowercase email (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Another Name',
          email: testUser.normalizedEmail,
          password: 'AnotherPassword123!',
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('should reject duplicate registration with different casing (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Third Name',
          email: 'TESTUSER1@example.com',
          password: 'AnotherPassword123!',
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });
  });

  describe('B. Registration Validation', () => {
    it('should reject invalid email format (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Valid Name',
          email: 'invalid-email-format',
          password: 'ValidPassword123!',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty fullName (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: '   ',
          email: 'validemail@example.com',
          password: 'ValidPassword123!',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject password shorter than 8 characters (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Valid Name',
          email: 'validemail@example.com',
          password: 'short',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unexpected/non-whitelisted properties (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          fullName: 'Valid Name',
          email: 'validemail@example.com',
          password: 'ValidPassword123!',
          isAdmin: true,
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('C. User Login', () => {
    it('should successfully log in with valid credentials (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe(testUser.normalizedEmail);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should reject incorrect password with generic error (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword999!',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject nonexistent email with generic error (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent-user@example.com',
          password: 'AnyPassword123!',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('D. Protected Route GET /api/auth/me', () => {
    let validToken = '';

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.normalizedEmail,
          password: testUser.password,
        });
      validToken = loginRes.body.accessToken;
    });

    it('should reject request with missing Authorization header (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toBe('Authentication required');
    });

    it('should reject request with malformed token with normalized error (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload')
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toBe('Invalid or malformed authentication token');
      expect(res.body.message).not.toContain('jwt malformed');
    });

    it('should reject request with expired token with clear session expired message (401)', async () => {
      const configService = app.get(ConfigService);
      const jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
      const expiredToken = jwt.sign(
        { sub: '55e79b27-9ce7-4480-98cf-db44fc9c4dc9', email: testUser.normalizedEmail },
        jwtSecret,
        { expiresIn: -10 },
      );

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ' + expiredToken)
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toBe('Session expired. Please log in again.');
      expect(res.body.message).not.toContain('jwt expired');
    });

    it('should return current user profile with valid JWT (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ' + validToken)
        .expect(200);

      expect(res.body.email).toBe(testUser.normalizedEmail);
      expect(res.body.fullName).toBe('Test User One');
      expect(res.body.id).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
    });
  });

  describe('E. Logout Endpoint POST /api/auth/logout', () => {
    let validToken = '';

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.normalizedEmail,
          password: testUser.password,
        });
      validToken = loginRes.body.accessToken;
    });

    it('should reject unauthenticated logout request (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });

    it('should return success for authenticated logout request (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer ' + validToken)
        .expect(200);

      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('F. JWT Security & Claims Inspection', () => {
    it('should ensure JWT contains minimal payload without sensitive secrets', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.normalizedEmail,
          password: testUser.password,
        });

      const token = loginRes.body.accessToken;
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBeDefined();
      expect(decoded.email).toBe(testUser.normalizedEmail);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      // Ensure no password or sensitive hash in JWT
      expect(decoded.password).toBeUndefined();
      expect(decoded.passwordHash).toBeUndefined();
    });
  });

  describe('G. Direct Database Security Verification (Section 20)', () => {
    it('should verify password is stored as strong bcrypt hash and plaintext is never stored', async () => {
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.normalizedEmail },
      });

      expect(dbUser).not.toBeNull();
      if (!dbUser) return;

      // Stored hash must not be the original password
      expect(dbUser.passwordHash).not.toBe(testUser.password);

      // Verify bcrypt cost and comparison
      const isMatch = await bcrypt.compare(testUser.password, dbUser.passwordHash);
      expect(isMatch).toBe(true);

      // Verify incorrect password does not match
      const isWrongMatch = await bcrypt.compare('WrongPassword!', dbUser.passwordHash);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('H. Rate Limiting Protection (Section 19 G)', () => {
    it('should eventually return 429 Too Many Requests with normalized error message', async () => {
      let hitRateLimit = false;
      let rateLimitResponse: request.Response | null = null;
      for (let i = 0; i < 25; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'rate-limit-test@example.com',
            password: 'AnyPassword123!',
          });

        if (res.status === 429) {
          hitRateLimit = true;
          rateLimitResponse = res;
          break;
        }
      }
      expect(hitRateLimit).toBe(true);
      expect(rateLimitResponse).not.toBeNull();
      if (rateLimitResponse) {
        expect(rateLimitResponse.body.statusCode).toBe(429);
        expect(rateLimitResponse.body.code).toBe('TOO_MANY_REQUESTS');
        expect(rateLimitResponse.body.message).toBe(
          'Too many requests. Please try again later.',
        );
        expect(rateLimitResponse.body.message).not.toContain('ThrottlerException');
      }
    });
  });

  describe('I. JWT_SECRET Startup Configuration Verification', () => {
    it('should reject missing or empty JWT_SECRET on startup', () => {
      expect(() => validateJwtSecret(undefined)).toThrow('missing or empty');
      expect(() => validateJwtSecret('')).toThrow('missing or empty');
      expect(() => validateJwtSecret('   ')).toThrow('missing or empty');
    });

    it('should reject known unsafe placeholders and short secrets on startup', () => {
      expect(() => validateJwtSecret('secret')).toThrow();
      expect(() => validateJwtSecret('password')).toThrow();
      expect(() => validateJwtSecret('changeme')).toThrow();
      expect(() => validateJwtSecret('development-secret')).toThrow();
      expect(() => validateJwtSecret('your_jwt_secret_here')).toThrow();
      expect(() => validateJwtSecret('too-short')).toThrow('too short');
    });

    it('should accept valid, cryptographically strong secret', () => {
      const valid = 'this-is-a-valid-secure-random-jwt-secret-with-sufficient-length';
      expect(validateJwtSecret(valid)).toBe(valid);
    });
  });
});
