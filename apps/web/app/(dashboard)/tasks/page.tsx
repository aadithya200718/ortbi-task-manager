'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, Check, ChevronLeft, ChevronRight, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { TaskDialog } from '../../../components/tasks/task-dialog';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { Skeleton } from '../../../components/ui/skeleton';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { formatDate, formatDateTime } from '../../../lib/utils';
import { PaginatedTasksResponse, Project, Task, TaskPriority, TaskQueryParams, TaskStatus } from '../../../types';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');
  const [sortBy, setSortBy] = useState<TaskQueryParams['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const projectsQuery = useQuery({ queryKey: ['projects-lookup'], queryFn: () => projectsApi.getProjects({ limit: 100, sortBy: 'name', sortOrder: 'asc' }) });
  const queryParams: TaskQueryParams = { search: debouncedSearch || undefined, projectId: projectFilter === 'ALL' ? undefined : projectFilter, status: statusFilter === 'ALL' ? undefined : statusFilter, priority: priorityFilter === 'ALL' ? undefined : priorityFilter, sortBy, sortOrder, page, limit: 10 };
  const tasksQuery = useQuery({ queryKey: ['tasks', queryParams], queryFn: () => tasksApi.getTasks(queryParams) });

  const toggleTask = useMutation({
    mutationFn: ({ task, nextStatus }: { task: Task; nextStatus: TaskStatus }) => tasksApi.updateTask(task.id, { status: nextStatus }),
    onMutate: async ({ task, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', queryParams] });
      const previous = queryClient.getQueryData<PaginatedTasksResponse>(['tasks', queryParams]);
      queryClient.setQueryData<PaginatedTasksResponse>(['tasks', queryParams], (current) => current ? { ...current, items: current.items.map((item) => item.id === task.id ? { ...item, status: nextStatus, completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : null } : item) } : current);
      return { previous };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(['tasks', queryParams], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-preview'] }); },
  });

  const deleteTask = useMutation({ mutationFn: (id: string) => tasksApi.deleteTask(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); setDeletingTask(null); } });
  const projectNames = useMemo(() => new Map((projectsQuery.data?.items || []).map((project) => [project.id, project.name])), [projectsQuery.data]);
  const tasks = tasksQuery.data?.items || [];
  const pagination = tasksQuery.data?.pagination;
  const projects = projectsQuery.data?.items || [];
  const filtersActive = Boolean(debouncedSearch || projectFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL');
  const resetFilters = () => { setSearchTerm(''); setProjectFilter('ALL'); setStatusFilter('ALL'); setPriorityFilter('ALL'); setSortBy('createdAt'); setSortOrder('desc'); setPage(1); };

  return (
    <div className="min-w-0 space-y-7 overflow-hidden">
      <header className="flex items-end justify-between gap-4">
        <div><h2 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[32px]">Tasks</h2><p className="mt-1.5 text-sm text-[#8b8b94]">Track and manage work across your projects.</p></div>
        <Button className="hidden sm:inline-flex" size="sm" onClick={() => { setEditingTask(null); setDialogOpen(true); }}><Plus size={14} />New task</Button>
      </header>

      <section aria-label="Task filters" className="min-w-0 space-y-2.5 lg:flex lg:items-center lg:gap-2.5 lg:space-y-0">
        <div className="relative min-w-0 lg:w-[360px] lg:shrink-0"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64646d]" strokeWidth={1.7} /><input aria-label="Search tasks" className="field-control search-field w-full text-[#F5F5F4] placeholder:text-[#64646d]" placeholder="Search tasks" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
        <div className="grid max-w-full min-w-0 grid-cols-2 gap-2 lg:flex lg:flex-1 lg:items-center lg:pb-0">
          <FilterSelect label="Status" value={statusFilter} onChange={(value) => { setStatusFilter(value as 'ALL' | TaskStatus); setPage(1); }} options={[['ALL', 'Status'], ['PENDING', 'Pending'], ['IN_PROGRESS', 'In progress'], ['COMPLETED', 'Completed']]} />
          <FilterSelect label="Project" value={projectFilter} onChange={(value) => { setProjectFilter(value); setPage(1); }} options={[['ALL', 'Project'], ...projects.map((project: Project) => [project.id, project.name] as [string, string])]} />
          <FilterSelect label="Priority" value={priorityFilter} onChange={(value) => { setPriorityFilter(value as 'ALL' | TaskPriority); setPage(1); }} options={[['ALL', 'Priority'], ['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low']]} />
          <FilterSelect label="Sort" value={`${sortBy}-${sortOrder}`} onChange={(value) => { const [nextSort, nextOrder] = value.split('-'); setSortBy(nextSort as TaskQueryParams['sortBy']); setSortOrder(nextOrder as 'asc' | 'desc'); setPage(1); }} options={[['createdAt-desc', 'Newest'], ['createdAt-asc', 'Oldest'], ['dueDate-asc', 'Due soon'], ['priority-desc', 'Priority'], ['name-asc', 'Name']]} />
        </div>
      </section>

      {tasksQuery.isLoading ? <TaskListSkeleton /> : tasksQuery.isError ? (
        <StatePanel title="Unable to load tasks" body={tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Please try again.'}><Button size="sm" variant="outline" onClick={() => tasksQuery.refetch()}>Retry</Button></StatePanel>
      ) : tasks.length === 0 ? (
        <StatePanel title="No tasks found" body={filtersActive ? 'Adjust your search or active filters.' : 'Create a task when you know the next concrete action.'}>{filtersActive ? <Button size="sm" variant="outline" onClick={resetFilters}>Reset filters</Button> : <Button size="sm" onClick={() => setDialogOpen(true)}><Plus size={14} />Create task</Button>}</StatePanel>
      ) : (
        <section aria-label="Tasks" className="border-t border-white/[0.075]">
          <div className="hidden grid-cols-[minmax(0,1fr)_88px_100px_105px_70px] gap-4 border-b border-white/[0.075] px-2 py-2.5 text-[11px] font-medium text-[#64646d] lg:grid"><span>Task</span><span>Priority</span><span>Status</span><span>Due</span><span /></div>
          <div className="divide-y divide-white/[0.065]">{tasks.map((task) => <TaskRow key={task.id} task={task} projectName={projectNames.get(task.projectId) || 'Project'} pending={toggleTask.isPending && toggleTask.variables?.task.id === task.id} onToggle={() => toggleTask.mutate({ task, nextStatus: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })} onEdit={() => { setEditingTask(task); setDialogOpen(true); }} onDelete={() => setDeletingTask(task)} />)}</div>
        </section>
      )}

      {pagination && pagination.totalPages > 1 ? <footer className="flex items-center justify-between text-xs text-[#71717A]"><span>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span><div className="flex items-center gap-1"><button className="focus-ring rounded-lg border border-white/[0.08] p-2 hover:bg-white/[0.04] disabled:opacity-30" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><ChevronLeft size={15} /></button><span className="px-2 tabular-nums">{page} / {pagination.totalPages}</span><button className="focus-ring rounded-lg border border-white/[0.08] p-2 hover:bg-white/[0.04] disabled:opacity-30" onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} disabled={page >= pagination.totalPages}><ChevronRight size={15} /></button></div></footer> : null}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editingTask} />
      <ConfirmDialog open={Boolean(deletingTask)} onOpenChange={(open) => { if (!open) setDeletingTask(null); }} title="Delete task" description={`Delete ${deletingTask?.name || 'this task'}? This cannot be undone.`} confirmText="Delete task" isLoading={deleteTask.isPending} onConfirm={() => { if (deletingTask) deleteTask.mutate(deletingTask.id); }} />
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="relative min-w-0 lg:shrink-0"><span className="sr-only">{label}</span><select className="h-9 w-full appearance-none rounded-lg border border-white/[0.09] bg-[#141416] py-0 pl-3 pr-8 text-xs text-[#C4C4CA] outline-none transition-colors hover:border-white/[0.15] focus:border-[#5B6CFF] lg:max-w-[180px]" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#64646d]">⌄</span></label>;
}

function TaskRow({ task, projectName, pending, onToggle, onEdit, onDelete }: { task: Task; projectName: string; pending: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const completed = task.status === 'COMPLETED';
  const statusLabel = task.status === 'IN_PROGRESS' ? 'In progress' : task.status.charAt(0) + task.status.slice(1).toLowerCase();
  const priorityClass = task.priority === 'HIGH' ? 'text-rose-300' : task.priority === 'MEDIUM' ? 'text-amber-300' : 'text-[#8b8b94]';
  const statusClass = completed ? 'text-emerald-300' : task.status === 'IN_PROGRESS' ? 'text-[#8B98FF]' : 'text-[#8b8b94]';
  return (
    <article className="group grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-2 py-2 transition-colors hover:bg-white/[0.026] lg:grid-cols-[auto_minmax(0,1fr)_88px_100px_105px_70px] lg:gap-4">
      <button onClick={onToggle} disabled={pending} className={`interactive-press focus-ring flex h-5 w-5 items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-[var(--motion-fast)] ${completed ? 'border-emerald-400/60 bg-emerald-400 text-[#07120d]' : 'border-white/25 text-transparent hover:border-[#7483ff]'}`} aria-label={completed ? `Reopen ${task.name}` : `Complete ${task.name}`}><Check size={12} strokeWidth={3} /></button>
      <div className="min-w-0"><h3 className={`task-state-change truncate text-[14px] font-medium ${completed ? 'text-[#71717A] line-through decoration-white/20' : 'text-[#E8E8E6]'}`}>{task.name}</h3><div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-[#71717A]"><Link href={`/projects/${task.projectId}`} className="truncate transition-colors hover:text-[#8B98FF]">{projectName}</Link>{task.completedAt ? <><span>·</span><span className="hidden shrink-0 text-emerald-300/70 sm:inline">Completed {formatDateTime(task.completedAt)}</span></> : task.dueDate ? <><span>·</span><span className="flex shrink-0 items-center gap-1 lg:hidden"><Calendar size={11} />{formatDate(task.dueDate)}</span></> : null}</div></div>
      <div className="flex items-center gap-3 lg:contents"><span className={`hidden text-xs capitalize lg:block ${priorityClass}`}>{task.priority.toLowerCase()}</span><span className={`hidden text-xs lg:block ${statusClass}`}>{statusLabel}</span><time className="hidden text-xs tabular-nums text-[#71717A] lg:block">{task.dueDate ? formatDate(task.dueDate) : 'No date'}</time><div className="flex justify-end gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"><button onClick={onEdit} className="focus-ring rounded-md p-2 text-[#71717A] hover:bg-white/[0.05] hover:text-white" aria-label={`Edit ${task.name}`}><Edit2 size={15} /></button><button onClick={onDelete} className="focus-ring rounded-md p-2 text-[#71717A] hover:bg-rose-500/[0.08] hover:text-rose-300" aria-label={`Delete ${task.name}`}><Trash2 size={15} /></button></div></div>
    </article>
  );
}

function StatePanel({ title, body, children }: { title: string; body: string; children: React.ReactNode }) { return <div className="mx-auto max-w-md border-y border-white/[0.075] py-10 text-center"><AlertCircle className="mx-auto h-5 w-5 text-[#8b8b94]" /><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#71717A]">{body}</p><div className="mt-4">{children}</div></div>; }
function TaskListSkeleton() { return <div className="space-y-1 border-t border-white/[0.075] pt-2">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-[66px]" />)}</div>; }
