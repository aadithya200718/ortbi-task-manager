# Orbit — Project & Task Manager

A secure cross-platform project and task management system built with Next.js, React Native, NestJS, and PostgreSQL.

---

## Overview

Orbit is a full-stack, cross-platform productivity and task management solution. It empowers users to organize projects, track tasks, and monitor completion statistics seamlessly across modern desktop web browsers and Android mobile devices, backed by a unified NestJS API and PostgreSQL database.

*Current Phase: Phase 1 — Repository Foundation.*

---

## Architecture

Orbit follows a monorepo architecture with a single authoritative backend:

- **Unified Backend:** A NestJS REST API exposing secure, validated endpoints.
- **Single Relational Database:** PostgreSQL managed with Prisma ORM.
- **Web Client:** Next.js with App Router and Tailwind CSS.
- **Mobile Client:** React Native with Expo and Expo Router for Android.
- **Shared Packages:** Common TypeScript interfaces and validation schemas shared across apps.

For more architectural details, see [docs/architecture.md](docs/architecture.md) and [implementation.md](implementation.md).

---

## Features

### Implemented in Phase 1
- Monorepo repository setup using pnpm workspaces.
- NestJS API foundation with strict TypeScript configuration.
- Next.js web application foundation with App Router and Tailwind CSS.
- Expo React Native mobile application foundation with Expo Router.
- Shared `@orbit/types` and `@orbit/validation` packages.
- Base documentation and environment variable template.

### Planned — implementation pending
- User Registration, Login, Logout, and Token Authentication (JWT + bcrypt).
- User Profile and Session Management.
- Project CRUD, Filtering, and Search.
- Task CRUD, Priority Management, and Status Tracking.
- User-Isolated Dashboard Metrics.
- Mobile Offline State Handling and Pull-to-Refresh.
- Swagger / OpenAPI Documentation.
- Docker & Docker Compose setup.

---

## Tech Stack

- **Monorepo & Workspaces:** pnpm workspaces
- **Language:** TypeScript (strict mode enabled across all packages)
- **Backend:** NestJS, Node.js
- **Database:** PostgreSQL (with Prisma ORM — Planned)
- **Web Frontend:** Next.js (App Router), React, Tailwind CSS
- **Mobile:** React Native, Expo, Expo Router
- **Shared Libraries:** `@orbit/types`, `@orbit/validation`

---

## Repository Structure

```text
orbit-project-manager/
├── apps/
│   ├── api/          # NestJS REST API
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native Expo mobile application
├── packages/
│   ├── types/        # Shared TypeScript domain & API types
│   └── validation/   # Shared validation schemas and utilities
├── docs/             # Architecture and project documentation
├── .env.example      # Environment variables template
├── .gitignore        # Monorepo git ignore rules
├── package.json      # Root package.json with workspace scripts
├── pnpm-workspace.yaml # pnpm workspace definition
└── README.md         # Project documentation
```

---

## Database Schema

*Planned — implementation pending (Phase 2).*

The database schema will feature `User`, `Project`, and `Task` entities with foreign key constraints and user-level data isolation in PostgreSQL via Prisma ORM.

---

## API Documentation

*Planned — implementation pending (Phase 2).*

Swagger / OpenAPI documentation will be hosted at `/api/docs` once API modules and endpoints are implemented.

---

## Local Development

### Prerequisites
- Node.js >= 20.x (Recommended: v22.x)
- pnpm >= 9.x (Installed: v12.x)
- Git

### Installation
Clone the repository and install all workspace dependencies from the root:

```bash
pnpm install
```

---

## Environment Variables

Copy `.env.example` to create your local `.env` files:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret key for signing JWT tokens.
- `JWT_EXPIRES_IN`: Expiration period for tokens (e.g., `1d`).
- `API_PORT`: Port on which the NestJS backend listens (default: `4000`).
- `WEB_ORIGIN`: Allowed origin for CORS (e.g., `http://localhost:3000`).
- `NEXT_PUBLIC_API_URL`: Backend API base URL for the web app.
- `EXPO_PUBLIC_API_URL`: Backend API base URL for the mobile app.

---

## Running the Backend

Start the NestJS API in development mode:

```bash
pnpm --filter @orbit/api dev
```

Build the API for production:

```bash
pnpm --filter @orbit/api build
```

---

## Running the Web App

Start the Next.js web development server:

```bash
pnpm --filter @orbit/web dev
```

Build the web application for production:

```bash
pnpm --filter @orbit/web build
```

---

## Running the Android App

Start the Expo development server:

```bash
pnpm --filter @orbit/mobile start
```

Run on an Android device or emulator:

```bash
pnpm --filter @orbit/mobile android
```

---

## Testing

*Planned — implementation pending.*

Automated testing with Jest and Supertest will be configured in subsequent phases.

---

## Security

*Planned — implementation pending.*

Security controls will include:
- Server-side JWT authentication and bcrypt password hashing.
- User ownership scoping on all queries to prevent IDOR / BOLA vulnerabilities.
- Helmet security headers and restrictive CORS policies.
- Input validation and sanitization using DTOs and Zod.

---

## Docker

*Planned — implementation pending.*

Dockerfiles for the API and Web applications along with `docker-compose.yml` will be provided once core application logic is stable.

---

## CI/CD

*Planned — implementation pending.*

GitHub Actions workflow for automated linting, typechecking, and testing.

---

## Deployment

*Planned — implementation pending.*

- Web: Vercel or equivalent.
- Backend: Railway / Render or containerized cloud host.
- Database: Managed PostgreSQL instance.
- Mobile: Android APK / Expo distribution.

---

## Demo

*Planned — implementation pending.*

Live demonstration credentials and video walkthrough will be provided upon completion of functional milestones.

---

## Known Limitations

- **Phase 1 Status:** Only the foundational monorepo scaffolding and configurations are active. Database models, authentication, and feature screens are pending Phase 2+.
- **Mobile Standalone Builds:** Mobile application currently operates via Expo CLI; release Android APK builds will be produced in later phases.
