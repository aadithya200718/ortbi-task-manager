/**
 * Orbit Shared Types Foundation
 * Phase 1: Foundation placeholder definitions.
 * Domain entities and API contracts will be defined in subsequent phases.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export type HealthStatus = 'ok' | 'error';

export interface HealthCheckResponse {
  status: HealthStatus;
}
