# Orbit — Architecture Overview

## 1. Project Objective

Orbit is a cross-platform project and task management system designed to provide personal productivity tracking across desktop web and mobile Android platforms. The objective of the system is to ensure data consistency, server-enforced security, and clean separation of concerns through a unified backend architecture.

## 2. High-Level Architecture

The Orbit platform utilizes a single, centralized backend serving both client interfaces:

```text
                           USER
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
           WEB APPLICATION         ANDROID APPLICATION
          (Next.js App Router)     (React Native Expo)
                 │                       │
                 └───────────┬───────────┘
                             │
                        HTTPS / REST
                             │
                      ┌──────▼──────┐
                      │  NestJS API │
                      ├─────────────┤
                      │ Core Domain │
                      └──────┬──────┘
                             │     
                      ┌──────▼──────┐
                      │  PostgreSQL │
                      └─────────────┘
```

## 3. Core Architectural Principles

1. **Single Backend**: Both the Next.js web application and the React Native Expo Android application communicate exclusively with the same NestJS REST API.
2. **Single Database**: The NestJS API connects to a single PostgreSQL relational database.
3. **No Secondary Backends**: Services such as Firebase or Supabase are not used as backends. All business logic, authentication, and validation are handled within the primary NestJS API.
4. **Server-Side Enforcement**: Security, authorization, and data validation are strictly enforced at the API and database levels. All resource queries are strictly scoped to the authenticated user.
5. **Shared Packages**: Domain types and shared validation rules reside in monorepo packages (`@orbit/types` and `@orbit/validation`) to ensure contract consistency across web and mobile.

## 4. Current Status

This repository is currently in **Phase 1 (Repository Foundation)**. The foundational monorepo structure, workspace configuration, base applications, and shared packages are initialized. Business logic, database migrations, authentication, and full UI screens are planned for subsequent phases.

For the authoritative specification and implementation roadmap, refer to [implementation.md](../implementation.md).
