import React from 'react';
import { ProjectStatus, TaskPriority, TaskStatus } from '../../types';
import { cn } from '../../lib/utils';

const statusCopy: Record<ProjectStatus | TaskStatus, string> = {
  NOT_STARTED: 'Planned',
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

const statusClass: Record<ProjectStatus | TaskStatus, string> = {
  NOT_STARTED: 'text-[#8b8b94]',
  PENDING: 'text-amber-300',
  IN_PROGRESS: 'text-[#8B98FF]',
  COMPLETED: 'text-emerald-300',
};

const priorityClass: Record<TaskPriority, string> = {
  LOW: 'text-[#8b8b94]',
  MEDIUM: 'text-amber-300',
  HIGH: 'text-rose-300',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={cn('text-xs font-medium', statusClass[status])}>{statusCopy[status]}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn('text-xs font-medium', statusClass[status])}>{statusCopy[status]}</span>;
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={cn('text-xs font-medium capitalize', priorityClass[priority])}>{priority.toLowerCase()}</span>;
}

export interface BadgeProps {
  status?: ProjectStatus | TaskStatus;
  priority?: TaskPriority;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ status, priority, className, children }: BadgeProps) {
  if (priority) return <TaskPriorityBadge priority={priority} />;
  if (status === 'PENDING') return <TaskStatusBadge status={status} />;
  if (status) return <ProjectStatusBadge status={status as ProjectStatus} />;
  return <span className={cn('text-xs font-medium text-[#A1A1AA]', className)}>{children}</span>;
}
