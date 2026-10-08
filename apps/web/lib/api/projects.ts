import { apiClient } from './client';
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryParams,
  PaginatedProjectsResponse,
} from '../../types';

export const projectsApi = {
  async getProjects(params?: ProjectQueryParams): Promise<PaginatedProjectsResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = qs ? `/projects?${qs}` : '/projects';
    return apiClient<PaginatedProjectsResponse>(endpoint, { method: 'GET' });
  },

  async getProjectById(id: string): Promise<Project> {
    return apiClient<Project>(`/projects/${id}`, { method: 'GET' });
  },

  async createProject(data: CreateProjectInput): Promise<Project> {
    return apiClient<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
    return apiClient<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string): Promise<void> {
    return apiClient<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};
