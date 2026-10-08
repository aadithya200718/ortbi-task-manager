import { apiClient } from './client';
import { DashboardStats } from '../../types';

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    return apiClient<DashboardStats>('/dashboard', { method: 'GET' });
  },
};
