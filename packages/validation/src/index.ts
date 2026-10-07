/**
 * Orbit Shared Validation Foundation
 * Phase 1: Foundation placeholder definitions.
 * Business validation schemas (e.g. Zod schemas) will be added in later phases.
 */

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};
