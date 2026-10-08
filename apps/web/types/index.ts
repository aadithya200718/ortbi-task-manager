export interface User {
  id: string;
  fullName: string;
  name?: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ProjectQueryParams {
  search?: string;
  status?: ProjectStatus;
  sortBy?: 'name' | 'createdAt' | 'startDate' | 'endDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedProjectsResponse {
  items: Project[];
  pagination: PaginationMeta;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  projectId: string;
  name: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface TaskQueryParams {
  search?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: 'name' | 'createdAt' | 'dueDate' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedTasksResponse {
  items: Task[];
  pagination: PaginationMeta;
}

export interface DashboardStats {
  totalProjects: number;
  projectsNotStarted: number;
  projectsInProgress: number;
  projectsCompleted: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
}

export interface ApiErrorEnvelope {
  statusCode: number;
  code: string;
  message: string | string[];
  timestamp?: string;
  path?: string;
  errors?: Record<string, string[]>;
}
