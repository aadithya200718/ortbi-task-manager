import { apiClient } from './client';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryParams,
  PaginatedTasksResponse,
} from '../../types';

export const tasksApi = {
  async getTasks(params?: TaskQueryParams): Promise<PaginatedTasksResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = qs ? `/tasks?${qs}` : '/tasks';
    return apiClient<PaginatedTasksResponse>(endpoint, { method: 'GET' });
  },

  async getTaskById(id: string): Promise<Task> {
    return apiClient<Task>(`/tasks/${id}`, { method: 'GET' });
  },

  async createTask(data: CreateTaskInput): Promise<Task> {
    return apiClient<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates task. IMPORTANT: projectId must NEVER be included in update payload.
   */
  async updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
    const safeData: UpdateTaskInput = {};
    if (data.name !== undefined) safeData.name = data.name;
    if (data.description !== undefined) safeData.description = data.description;
    if (data.priority !== undefined) safeData.priority = data.priority;
    if (data.status !== undefined) safeData.status = data.status;
    if (data.dueDate !== undefined) safeData.dueDate = data.dueDate;
    return apiClient<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(safeData),
    });
  },

  async deleteTask(id: string): Promise<void> {
    return apiClient<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};
