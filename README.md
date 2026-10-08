# Orbit ? Project & Task Manager

A secure, production-grade cross-platform project and task management system built with Next.js 16, React Native Expo SDK 57, NestJS, Prisma ORM, and PostgreSQL.

---

## Overview

Orbit is a full-stack project and task management application designed for individual and team productivity. It empowers users to manage projects, organize prioritized tasks, track real-time completion analytics, and access their data with strict user isolation across web and mobile platforms.

---

## Architecture & Technology Stack

Orbit follows a monorepo architecture with a unified backend:

- **Monorepo:** pnpm workspaces
- **Backend API:** NestJS 10, TypeScript strict mode, Express, Passport JWT, Helmet, Throttler rate limiting
- **Database & ORM:** PostgreSQL, Prisma ORM 6 with migration tracking
- **Web Client:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, TanStack Query
- **Mobile Client:** React Native, Expo SDK 57, Expo Router
- **Testing:** Jest, Supertest, PostgreSQL-backed integration test suite (146 passing tests)
- **API Documentation:** OpenAPI / Swagger UI at `/api/docs`

---

## Database Architecture & Isolation

Orbit uses PostgreSQL with Prisma ORM.

### Databases: `orbit_dev` vs `orbit_test`

1. **Development Database (`orbit_dev`):**
   - Stores regular development data.
   - Preserves user accounts and test projects across app runs.
   - Connection URL: `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/orbit_dev?schema=public`

2. **Dedicated Test Database (`orbit_test`):**
   - Dedicated isolated database used exclusively for automated tests.
   - All 146 integration tests run against `orbit_test`.
   - The test runner fails closed if `TEST_DATABASE_URL` is missing or points to `orbit_dev` or production.
   - Development data is never touched or deleted during test runs.
   - Connection URL: `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/orbit_test?schema=public`

### Database Migrations

Apply database migrations to `orbit_dev`:
```bash
pnpm --filter @orbit/api exec prisma migrate deploy
```

Check migration status:
```bash
pnpm --filter @orbit/api exec prisma migrate status
```

---

## API Specifications & Endpoints

- **Base URL:** `http://localhost:4000/api`
- **Interactive Swagger Documentation:** `http://localhost:4000/api/docs`

### Core Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` ? Register new user account.
  - Enforces unique email, minimum 8 characters, and maximum 72 UTF-8 bytes (bcrypt limit).
- `POST /api/auth/login` ? Authenticate and receive JWT access token.
  - Enforces maximum 72 UTF-8 bytes.
- `GET /api/auth/me` ? Fetch currently authenticated user profile (Bearer token required).
- `POST /api/auth/logout` ? Stateless logout endpoint. Client discards token from `sessionStorage`.

#### Projects (`/api/projects`)
- `GET /api/projects` ? Paginated project listing with search, status filtering, and deterministic sorting (`orderBy: [{ [sortBy]: sortOrder }, { id: 'desc' }]`).
- `POST /api/projects` ? Create project owned by caller (`userId` extracted from JWT).
- `GET /api/projects/:id` ? Fetch project by ID (IDOR-protected).
- `PUT /api/projects/:id` ? Update project with Serializable transaction isolation and date range validation.
- `DELETE /api/projects/:id` ? Delete project. **Cascading behavior:** Deleting a project automatically deletes all child tasks via PostgreSQL `ON DELETE CASCADE`.

#### Tasks (`/api/tasks`)
- `GET /api/tasks` ? Paginated task list with project, status, priority filters and search.
- `POST /api/tasks` ? Create task with atomic parent relation connection (`project: { connect: { id_userId } }`).
- `GET /api/tasks/:id` ? Fetch task details with relational ownership verification.
- `PUT /api/tasks/:id` ? Update task with Serializable transaction isolation.
  - **Reassignment restriction:** Task `projectId` cannot be reassigned during updates.
  - **Completion Lifecycle:**
    - Transition to `COMPLETED`: sets `completedAt` to current timestamp.
    - Reopening to non-completed status: clears `completedAt` to `null`.
    - Unchanged `COMPLETED` status: preserves original `completedAt`.
- `DELETE /api/tasks/:id` ? Delete task.

#### Dashboard (`/api/dashboard`)
- `GET /api/dashboard` ? Returns real-time user-scoped counts (`totalProjects`, `projectsNotStarted`, `projectsInProgress`, `projectsCompleted`, `totalTasks`, `pendingTasks`, `inProgressTasks`, `completedTasks`, `taskCompletionRate`).

---

## Security & Architecture Highlights

1. **Strict User Scoping (Anti-IDOR):**
   - `userId` is never accepted in request bodies or query parameters.
   - All mutations and queries filter by the authenticated user's ID from the JWT payload.
2. **Bcrypt 72-Byte UTF-8 Enforcement:**
   - Both registration and login DTOs enforce a strict 72 UTF-8 byte maximum via `@MaxUtf8Bytes(72)` to prevent silent password truncation.
   - Bcrypt cost factor is configured to 12.
3. **Concurrency-Safe Transitions:**
   - Project and task updates utilize PostgreSQL `Serializable` transaction isolation with bounded retries (maximum 3 attempts) to prevent race conditions.
4. **Sanitized Error Logging:**
   - Error filters automatically redact passwords, hashes, JWT tokens, and database credentials from application logs.
5. **Token Storage & Stateless Logout:**
   - Access tokens are stored in browser `sessionStorage` and sent via `Authorization: Bearer <token>`.
   - Logout is stateless: the client clears `sessionStorage` and auth state.

---

## Environment Configuration

Create `.env` from `.env.example`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/orbit_dev?schema=public
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/orbit_test?schema=public

# Authentication Secrets
JWT_SECRET=your_secure_256_bit_secret_here
JWT_EXPIRES_IN=1h

# Backend Configuration
API_PORT=4000
WEB_ORIGIN=http://localhost:3000

# Client Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Development & Testing Commands

### Backend API
```bash
# Start backend dev server
pnpm --filter @orbit/api dev

# Run all 146 integration tests against orbit_test
pnpm --filter @orbit/api test

# Typecheck and lint API
pnpm --filter @orbit/api typecheck
pnpm --filter @orbit/api lint

# Build API bundle
pnpm --filter @orbit/api build
```

### Web Application
```bash
# Start Next.js development server
pnpm --filter @orbit/web dev

# Typecheck and lint web application
pnpm --filter @orbit/web typecheck
pnpm --filter @orbit/web lint

# Build production Next.js application
pnpm --filter @orbit/web build
```

### Workspace-wide Checks
```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm peers check
```
