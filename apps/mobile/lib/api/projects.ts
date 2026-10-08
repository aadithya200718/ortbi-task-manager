import { apiClient, toQueryString } from './client';
import type { CreateProjectInput, PaginatedResponse, Project, ProjectQueryParams, UpdateProjectInput } from '../types';

export const projectsApi = {
  list: (params: ProjectQueryParams = {}) => apiClient<PaginatedResponse<Project>>(`/projects${toQueryString(params)}`),
  get: (id: string) => apiClient<Project>(`/projects/${id}`),
  create: (input: CreateProjectInput) => apiClient<Project>('/projects', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateProjectInput) => apiClient<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  delete: (id: string) => apiClient<void>(`/projects/${id}`, { method: 'DELETE' }),
};
