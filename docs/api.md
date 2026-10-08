# Orbit API Documentation & Integration Contracts

Base URL: `http://localhost:4000/api`
Swagger Docs: `http://localhost:4000/api/docs`

---

## 1. Authentication

### `POST /api/auth/register`
Creates a new user account.
- **Request Body:**
  - `fullName` (string, 1-100 chars, required)
  - `email` (string, valid email, max 255 chars, required)
  - `password` (string, 8-72 chars, max 72 UTF-8 bytes, required)
- **Responses:**
  - `201 Created`: `{ user: { id, fullName, email, createdAt }, accessToken }`
  - `400 Bad Request`: Validation failed or password > 72 UTF-8 bytes
  - `409 Conflict`: Email already registered
  - `429 Too Many Requests`: Throttled

### `POST /api/auth/login`
Authenticates an existing user.
- **Request Body:**
  - `email` (string, valid email, required)
  - `password` (string, max 72 UTF-8 bytes, required)
- **Responses:**
  - `200 OK`: `{ user: { id, fullName, email, createdAt }, accessToken }`
  - `400 Bad Request`: Validation failed or password > 72 UTF-8 bytes
  - `401 Unauthorized`: Invalid email or password
  - `429 Too Many Requests`: Throttled

### `GET /api/auth/me`
Returns profile of the authenticated user.
- **Headers:** `Authorization: Bearer <accessToken>`
- **Responses:**
  - `200 OK`: `{ id, fullName, email, createdAt }`
  - `401 Unauthorized`: Missing, expired, or invalid token

### `POST /api/auth/logout`
Stateless logout. Client is responsible for discarding the access token from `sessionStorage`.
- **Headers:** `Authorization: Bearer <accessToken>`
- **Responses:**
  - `200 OK`: `{ message: "Logged out successfully" }`

---

## 2. Projects

### `GET /api/projects`
List user-owned projects with pagination, search, and sorting.
- **Query Parameters:**
  - `search` (optional string)
  - `status` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
  - `sortBy` (`name`, `createdAt`, `startDate`, `endDate`, default: `createdAt`)
  - `sortOrder` (`asc`, `desc`, default: `desc`)
  - `page` (integer >= 1, default: 1)
  - `limit` (integer 1-100, default: 20)
- **Sorting Invariant:** Ordered by `[{ [sortBy]: sortOrder }, { id: 'desc' }]` for deterministic pagination.
- **Responses:**
  - `200 OK`: `{ items: Project[], pagination: { page, limit, total, totalPages } }`

### `POST /api/projects`
Create a project for the authenticated user.
- **Request Body:**
  - `name` (string, non-empty, max 255 chars, required)
  - `description` (optional string, max 5000 chars, nullable)
  - `status` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, default: `NOT_STARTED`)
  - `startDate` (optional YYYY-MM-DD date string, nullable)
  - `endDate` (optional YYYY-MM-DD date string >= startDate, nullable)
- **Responses:**
  - `201 Created`: Created `Project` object

### `GET /api/projects/:id`
Retrieve project details. IDOR protected: returns 404 if not owned by caller.

### `PUT /api/projects/:id`
Update project. Uses Serializable transaction isolation with bounded retries.
- Non-nullable fields (`name`, `status`) reject explicit `null`.
- Nullable fields (`description`, `startDate`, `endDate`) can be cleared with `null`.

### `DELETE /api/projects/:id`
Delete project. **Cascade Rule:** Automatically deletes all child tasks.

---

## 3. Tasks

### `GET /api/tasks`
List tasks for the authenticated user.
- **Query Parameters:** `search`, `projectId`, `status`, `priority`, `page`, `limit`, `sortBy`, `sortOrder`.
- **Responses:** `{ items: Task[], pagination: { page, limit, total, totalPages } }`

### `POST /api/tasks`
Create a task under an owned project.
- **Request Body:**
  - `projectId` (UUID, required; verified against user ownership atomically)
  - `name` (string, non-empty, max 255 chars, required)
  - `description` (optional string, max 5000 chars, nullable)
  - `priority` (`LOW`, `MEDIUM`, `HIGH`, default: `MEDIUM`)
  - `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, default: `PENDING`)
  - `dueDate` (optional YYYY-MM-DD date string, nullable)

### `PUT /api/tasks/:id`
Update task.
- **Important:** `projectId` cannot be reassigned on update. Passing `projectId` returns HTTP 400.
- **CompletedAt Lifecycle:**
  - Set to `new Date()` when status becomes `COMPLETED`.
  - Cleared to `null` when reopened from `COMPLETED` to `PENDING` or `IN_PROGRESS`.
  - Preserved unchanged if status remains `COMPLETED`.

### `DELETE /api/tasks/:id`
Deletes the task. Ownership verified via parent project.

---

## 4. Dashboard

### `GET /api/dashboard`
Returns aggregated statistics computed in PostgreSQL:
```json
{
  "totalProjects": 3,
  "projectsNotStarted": 1,
  "projectsInProgress": 1,
  "projectsCompleted": 1,
  "totalTasks": 10,
  "pendingTasks": 3,
  "inProgressTasks": 2,
  "completedTasks": 5,
  "taskCompletionRate": 50
}
```
