import { apiClient } from './client';
import type { DashboardStats } from '../types';

export const dashboardApi = { get: () => apiClient<DashboardStats>('/dashboard') };
