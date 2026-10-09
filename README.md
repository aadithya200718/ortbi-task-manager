<div align="center">
  <img src="docs/assets/orbit-logo.png" alt="Orbit logo" width="104" />

# Orbit

**A secure, cross-platform workspace for planning projects, prioritizing tasks, and tracking progress.**

Next.js · React Native / Expo · NestJS · PostgreSQL · TypeScript

[Live Web App](https://ortbi-task-manager.vercel.app) · [Swagger API](https://orbit-api-9uh5.onrender.com/api/docs) · [API Health](https://orbit-api-9uh5.onrender.com/api/health)
</div>

---

## Overview

Orbit is a full-stack project and task management application delivered through a responsive Next.js web client and an Expo Android client. Registration, authentication, projects, tasks, and dashboard analytics are served by one NestJS REST API and persisted in one PostgreSQL database.

The repository emphasizes production engineering as much as product functionality: server-side ownership checks, strict validation, bounded serializable transactions, migration tracking, secure client session handling, deterministic pagination, and cross-platform contract sharing are built into the implementation.

The production topology uses Vercel for the web client, Render for the API, and Neon for PostgreSQL. Both clients operate against the same deployed backend and data model.

## Product Preview

### Web experience

| Authentication | Project workspace |
| --- | --- |
| <img src="docs/screenshots/final/web-login.png" alt="Orbit web login" width="100%" /> | <img src="docs/screenshots/final/web-project-detail.png" alt="Orbit web project detail" width="100%" /> |

### Mobile workspace

| Dashboard | Projects | Tasks |
| --- | --- | --- |
| <img src="docs/screenshots/final/mobile-dashboard.png" alt="Orbit Android dashboard" width="260" /> | <img src="docs/screenshots/final/mobile-projects.png" alt="Orbit Android projects" width="260" /> | <img src="docs/screenshots/final/mobile-tasks.png" alt="Orbit Android tasks" width="260" /> |

| Project detail | Task filters | Create task |
| --- | --- | --- |
| <img src="docs/screenshots/final/mobile-project-detail.png" alt="Orbit Android project detail" width="260" /> | <img src="docs/screenshots/final/mobile-task-filters.png" alt="Orbit Android task filters" width="260" /> | <img src="docs/screenshots/final/mobile-create-task.png" alt="Orbit Android create task form" width="260" /> |

### Authentication experience

| Sign in | Create account |
| --- | --- |
| <img src="docs/screenshots/final/mobile-login.png" alt="Orbit Android login" width="320" /> | <img src="docs/screenshots/final/mobile-register.png" alt="Orbit Android registration" width="320" /> |

### Resilience / offline handling

<img src="docs/screenshots/final/mobile-offline.png" alt="Orbit Android offline recovery state" width="320" />

> Orbit is actively evolving. Screenshots reflect verified implementations at the time of capture and may differ from later UI iterations as usability and presentation continue to improve.

## Core Capabilities

| Area | Capabilities |
| --- | --- |
| Authentication | Registration, login, stateless logout, `/auth/me` session restoration, expired-session recovery |
| Projects | Create, read, update, delete, status tracking, date ranges, search, filtering, sorting, pagination |
| Tasks | Create, read, update, delete, priorities, workflow status, completion timestamps, due dates, search and filters |
| Dashboard | User-scoped project/task totals, active-work indicators, completion analytics, recent projects |
| Mobile | Native navigation, secure token storage, pull-to-refresh, offline states, shared production data |

## Architecture

```mermaid
flowchart LR
    User((User)) --> Web[Next.js Web]
    User --> Mobile[React Native / Expo Android]
    Web -->|HTTPS / REST| API[NestJS API]
    Mobile -->|HTTPS / REST| API
    API --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL)]

    Web -. deployed on .-> Vercel[Vercel]
    API -. deployed on .-> Render[Render]
    DB -. hosted by .-> Neon[Neon]
```

The web and Android clients share the same authentication model, REST resources, backend authorization, and PostgreSQL data. Domain types and reusable validation utilities live in workspace packages so the client contracts remain aligned with the API.

See [Architecture](docs/architecture.md) for request flow, trust boundaries, and deployment details, and [ER Diagram](docs/er-diagram.md) for the relational model.

## Assessment Requirement Coverage

The following mapping is based on the current source and deployable repository—not on planned functionality.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Web application | Implemented | Next.js application in `apps/web` |
| Android application | Implemented | React Native / Expo application in `apps/mobile` |
| One shared backend | Implemented | Both clients call the NestJS API in `apps/api` |
| One shared database | Implemented | API-only Prisma access to PostgreSQL |
| Registration, login, logout | Implemented | Auth endpoints and both client flows |
| Same account across web/mobile | Implemented | Shared JWT identity and production API |
| Project CRUD | Implemented | Authenticated `/api/projects` resource |
| Task CRUD | Implemented | Authenticated `/api/tasks` resource |
| Mark task complete | Implemented | Task status update with `completedAt` lifecycle |
| Dashboard statistics | Implemented | User-scoped `/api/dashboard` summary |
| Project search and status filter | Implemented | Validated project query DTO |
| Task search, status, and priority filters | Implemented | Validated task query DTO |
| Sorting and pagination | Implemented | Project/task list queries with deterministic tie-breakers |
| Mobile pull-to-refresh | Implemented | Refresh controls on mobile data screens |
| Secure device token storage | Implemented | Expo SecureStore with device-only protection |
| Expired token handling | Implemented | Centralized 401 handling clears local sessions |
| Offline handling | Implemented | Typed network failures, recovery UI, and retry actions |
| Responsive web UI | Implemented | Responsive Next.js layouts and navigation |
| Mobile navigation | Implemented | Expo Router auth and application routes |
| Backend validation | Implemented | Global strict `ValidationPipe` and DTO constraints |
| Error handling and safe logging | Implemented | Global exception filtering, redaction, request metadata logging |
| CORS and security headers | Implemented | Exact configured web origin and Helmet middleware |
| bcrypt and JWT authentication | Implemented | bcrypt cost 12 and Passport JWT |
| Protected routes | Implemented | JWT guards on user data endpoints |
| Anti-IDOR ownership authorization | Implemented | Queries scope projects/tasks through authenticated user ownership |
| SQL injection resistance | Implemented | Prisma parameterized database access; no raw user-built SQL |
| Authentication rate limiting | Implemented | NestJS Throttler with stricter auth limits |
| Required REST resources | Implemented | Auth, projects, tasks, dashboard, and health endpoints |
| API documentation | Implemented | Swagger/OpenAPI at `/api/docs` and [API reference](docs/api.md) |
| Environment and database setup | Implemented | Sanitized env templates, migrations, and local setup below |
| Mobile against deployed backend | Implemented | Configurable `EXPO_PUBLIC_API_URL` targets the shared API |

## Submission Links

| Artifact | Link |
| --- | --- |
| Web application | [ortbi-task-manager.vercel.app](https://ortbi-task-manager.vercel.app) |
| Backend API | [orbit-api-9uh5.onrender.com](https://orbit-api-9uh5.onrender.com) |
| Swagger documentation | [Open Swagger UI](https://orbit-api-9uh5.onrender.com/api/docs) |
| API health | [Check API and database health](https://orbit-api-9uh5.onrender.com/api/health) |
| Android APK / Expo build | **ADD BEFORE SUBMISSION** |
| Demo video | **ADD BEFORE SUBMISSION** |
| ER diagram | [View database model](docs/er-diagram.md) |

## Security Engineering

- **Authentication:** Passport JWT protects private routes; user identity is taken from the verified token rather than request-supplied ownership fields.
- **Password handling:** bcrypt uses cost factor 12. Registration and login enforce bcrypt's 72-byte limit using UTF-8 byte length, not JavaScript character count.
- **Authorization:** project and task lookups are scoped to the authenticated user. Cross-user identifiers resolve as not found, preventing direct-object-reference access.
- **Input and transport controls:** strict DTO validation rejects unknown properties, Helmet applies security headers, CORS is restricted to the configured web origin, and throttling limits general and authentication traffic.
- **Safe observability:** the global error path redacts bearer tokens, JWTs, database URLs, password hashes, and secret-like fields; request logs contain operational metadata rather than credentials.
- **Client sessions:** the web token is session-scoped; Android stores its token with Expo SecureStore using device-only protection. Both clients clear invalid sessions after unauthorized responses.
- **Test isolation:** API integration tests fail closed without a dedicated `TEST_DATABASE_URL` and reject development or production targets.

Read the complete [security policy and model](SECURITY.md).

## Reliability & Data Integrity

- Project and task mutations use PostgreSQL `Serializable` transactions with a bounded retry policy for recognized write conflicts.
- `completedAt` is set when a task enters `COMPLETED` and cleared when it leaves that state.
- Foreign keys model `User → Project → Task`; database cascades remove dependent projects or tasks with their parent.
- List endpoints use a stable `id` tie-breaker after the selected sort field, keeping pagination deterministic.
- Prisma migrations are committed and deployed as versioned schema changes.
- Health reporting checks database connectivity in addition to API process availability.

## Cross-Platform Architecture

| Layer | Role |
| --- | --- |
| Next.js web | Responsive browser client and session-scoped authentication |
| React Native / Expo | Android client, native navigation, secure storage, offline recovery |
| NestJS | Shared REST API, authentication, authorization, validation, domain behavior |
| PostgreSQL / Prisma | Shared relational data model, constraints, transactions, migrations |

Both client applications consume the same authentication, project, task, and dashboard contracts. There is no client-specific secondary backend or database.

## Testing & Quality

Results from the final documentation audit:

| Suite | Verified result |
| --- | --- |
| Web client | **13 tests passing** |
| Mobile client | **9 tests passing** |
| API integration | Suite present; requires an isolated PostgreSQL `TEST_DATABASE_URL`. It was not counted as passing because that service was unavailable in the audit environment. |

| Quality gate | API | Web | Mobile |
| --- | --- | --- | --- |
| TypeScript | Passed | Passed | Passed |
| Lint | Passed | Passed | Passed |
| Build | Passed | Passed | N/A (Expo client) |

The API integration harness validates its database target before running destructive test setup. This protects development and production data at the cost of requiring an intentionally provisioned test database.

## API

- **Production base:** `https://orbit-api-9uh5.onrender.com/api`
- **Swagger:** [https://orbit-api-9uh5.onrender.com/api/docs](https://orbit-api-9uh5.onrender.com/api/docs)
- **Health:** [https://orbit-api-9uh5.onrender.com/api/health](https://orbit-api-9uh5.onrender.com/api/health)

| Group | Purpose |
| --- | --- |
| `/api/auth` | Register, login, current user, logout |
| `/api/projects` | User-owned project CRUD and list queries |
| `/api/tasks` | User-owned task CRUD, completion, and list queries |
| `/api/dashboard` | Authenticated summary statistics |
| `/api/health` | Process and database readiness |

Detailed contracts are documented in [docs/api.md](docs/api.md).

## Technology Stack

| Layer | Technology |
| --- | --- |
| Monorepo | pnpm workspaces, TypeScript |
| Web | Next.js 16, React 19, Tailwind CSS, TanStack Query |
| Mobile | React Native, Expo SDK 57, Expo Router, SecureStore, TanStack Query |
| Backend | NestJS 10, Passport JWT, class-validator, Swagger/OpenAPI |
| Database | PostgreSQL, Prisma ORM 6, Prisma migrations |
| Security | bcrypt, Helmet, CORS, NestJS Throttler, server-side ownership checks |
| Testing | Jest, Supertest, React Testing Library |
| Infrastructure | Vercel, Render, Neon |

## Repository Structure

```text
apps/
  api/          # NestJS REST API, Prisma schema, migrations, integration tests
  web/          # Next.js browser application
  mobile/       # React Native / Expo Android application
packages/
  types/        # Shared domain and API types
  validation/   # Shared validation utilities
docs/
  assets/       # Repository media
  screenshots/  # Current and archived verified product captures
  api.md        # Endpoint reference
  architecture.md
  er-diagram.md
  implementation.md
```

## Local Development

### Requirements

- Node.js 22+
- pnpm 10+
- PostgreSQL

### Setup

```bash
pnpm install
cp .env.example .env
pnpm --filter @orbit/api exec prisma generate
pnpm --filter @orbit/api exec prisma migrate deploy
```

Start each application in a separate terminal:

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

For a physical Android device, set `EXPO_PUBLIC_API_URL` to an API address reachable from that device. API integration tests require a separate PostgreSQL database through `TEST_DATABASE_URL`.

## Environment Variables

Use local `.env` files or deployment-provider secret stores. Never commit real credentials.

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
TEST_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE_test
JWT_SECRET=replace_me_with_a_long_random_secret
JWT_EXPIRES_IN=1h
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_API_URL=http://DEVICE_REACHABLE_API:4000/api
```

See the tracked `.env.example` files for the complete sanitized template.

## Deployment

- **Web:** Vercel builds the Next.js workspace and injects `NEXT_PUBLIC_API_URL`.
- **API:** Render builds and runs the NestJS service with provider-managed production secrets.
- **Database:** Neon hosts PostgreSQL; Prisma migrations are applied through the API deployment workflow.
- **Mobile:** Expo reads `EXPO_PUBLIC_API_URL` at build/start time to use the same deployed API.

## Beyond the Minimum Requirements

- Isolated PostgreSQL-backed API integration suite with fail-closed database safeguards
- Web and mobile client test suites
- Deterministic pagination and multi-field sorting
- Shared domain types and validation workspace packages
- Mobile offline recovery, secure device token storage, and pull-to-refresh
- Automated CI quality gates for API, web, mobile, and shared packages

## UI / UX Development Status

Orbit is under active product development, and its interface continues to evolve through iterative UI/UX refinement.

The screenshots in this repository represent verified product states at the time they were captured. Future iterations may refine layout density, navigation, visual hierarchy, spacing, responsive behavior, and component styling while preserving the underlying API contracts, security model, database architecture, and core application behavior.

Recent interface work has focused on improving information density, task and project scanning, consistency between web and Android, responsive layouts, visual hierarchy, and unnecessary interface complexity. UI evolution is treated as continuous product refinement rather than a change to the underlying architecture.

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [ER diagram](docs/er-diagram.md)
- [Historical implementation plan](docs/implementation.md)
- [Security policy](SECURITY.md)

## Author

**Manaadithya S.**<br>
Computer Science · SRM University
