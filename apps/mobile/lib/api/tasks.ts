import { apiClient, toQueryString } from './client';
import type { CreateTaskInput, PaginatedResponse, Task, TaskQueryParams, UpdateTaskInput } from '../types';
import { sanitizeTaskUpdate } from '../task-payload';

export { sanitizeTaskUpdate } from '../task-payload';

export const tasksApi = {
  list: (params: TaskQueryParams = {}) => apiClient<PaginatedResponse<Task>>(`/tasks${toQueryString(params)}`),
  get: (id: string) => apiClient<Task>(`/tasks/${id}`),
  create: (input: CreateTaskInput) => apiClient<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateTaskInput) => apiClient<Task>(`/tasks/${id}`, {
    method: 'PUT', body: JSON.stringify(sanitizeTaskUpdate(input as Record<string, unknown>)),
  }),
  delete: (id: string) => apiClient<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
