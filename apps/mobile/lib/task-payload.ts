import type { UpdateTaskInput } from './types';

export function sanitizeTaskUpdate(input: Record<string, unknown>): UpdateTaskInput {
  const safe: UpdateTaskInput = {};
  if (typeof input.name === 'string') safe.name = input.name;
  if (input.description === null || typeof input.description === 'string') safe.description = input.description;
  if (input.priority === 'LOW' || input.priority === 'MEDIUM' || input.priority === 'HIGH') safe.priority = input.priority;
  if (input.status === 'PENDING' || input.status === 'IN_PROGRESS' || input.status === 'COMPLETED') safe.status = input.status;
  if (input.dueDate === null || typeof input.dueDate === 'string') safe.dueDate = input.dueDate;
  return safe;
}
