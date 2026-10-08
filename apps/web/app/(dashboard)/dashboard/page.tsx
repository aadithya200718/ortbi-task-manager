'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Check, Clock, Plus, RefreshCw } from 'lucide-react';
import { TaskDialog } from '../../../components/tasks/task-dialog';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { dashboardApi } from '../../../lib/api/dashboard';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { formatDate } from '../../../lib/utils';
import { useAuth } from '../../../providers/auth-provider';
import { PaginatedTasksResponse, Task, TaskStatus } from '../../../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const statsQuery = useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.getStats });
  const projectsQuery = useQuery({ queryKey: ['dashboard-projects-preview'], queryFn: () => projectsApi.getProjects({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }) });
  const tasksQuery = useQuery({ queryKey: ['dashboard-tasks-preview'], queryFn: () => tasksApi.getTasks({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }) });

  const toggleTask = useMutation({
    mutationFn: ({ task, nextStatus }: { task: Task; nextStatus: TaskStatus }) => tasksApi.updateTask(task.id, { status: nextStatus }),
    onMutate: async ({ task, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard-tasks-preview'] });
      const previous = queryClient.getQueryData<PaginatedTasksResponse>(['dashboard-tasks-preview']);
      queryClient.setQueryData<PaginatedTasksResponse>(['dashboard-tasks-preview'], (current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === task.id ? { ...item, status: nextStatus, completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : null } : item),
      } : current);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['dashboard-tasks-preview'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-preview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const projects = useMemo(() => projectsQuery.data?.items || [], [projectsQuery.data?.items]);
  const allTasks = useMemo(() => tasksQuery.data?.items || [], [tasksQuery.data?.items]);
  const projectNames = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);
  const focusTasks = useMemo(() => [...allTasks].sort((a, b) => Number(a.status === 'COMPLETED') - Number(b.status === 'COMPLETED')).slice(0, 5), [allTasks]);

  if (statsQuery.isLoading) return <DashboardSkeleton />;
  if (statsQuery.isError) {
    return (
      <div className="max-w-xl rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-5 text-rose-200">
        <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="text-sm font-semibold">Unable to load dashboard</h2><p className="mt-1 text-xs leading-5 text-rose-200/75">{statsQuery.error instanceof Error ? statsQuery.error.message : 'Please try again.'}</p><Button className="mt-3" variant="outline" size="sm" onClick={() => statsQuery.refetch()}><RefreshCw size={14} />Retry</Button></div></div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const firstName = (user?.fullName || user?.name || 'there').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div><h2 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[32px]">{greeting}, {firstName}</h2><p className="mt-1.5 text-sm text-[#8b8b94]">Here is where your work stands.</p></div>
        <Button className="hidden sm:inline-flex" size="sm" onClick={() => setTaskDialogOpen(true)}><Plus size={14} />New task</Button>
      </header>

      <section aria-label="Workspace summary" className="border-y border-white/[0.075] py-5">
        <div className="grid grid-cols-3 divide-x divide-white/[0.075]">
          <Metric value={stats?.totalTasks ?? 0} label="Tasks" detail={`${stats?.completedTasks ?? 0} completed`} />
          <Metric value={stats?.totalProjects ?? 0} label="Projects" detail={`${stats?.projectsInProgress ?? 0} active`} />
          <Metric value={`${Math.round(stats?.taskCompletionRate ?? 0)}%`} label="Complete" detail={`${stats?.completedTasks ?? 0} of ${stats?.totalTasks ?? 0} tasks`} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <section className="lg:col-span-8">
          <SectionHeader title="Focus" href="/tasks" />
          {tasksQuery.isLoading ? <div className="mt-2 space-y-1"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : focusTasks.length ? (
            <div className="mt-1 divide-y divide-white/[0.065]">
              {focusTasks.map((task) => <DashboardTaskRow key={task.id} task={task} projectName={projectNames.get(task.projectId)} onToggle={() => toggleTask.mutate({ task, nextStatus: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })} pending={toggleTask.isPending && toggleTask.variables?.task.id === task.id} />)}
            </div>
          ) : <EmptyLine text="No tasks yet. Create one when you are ready." />}
        </section>

        <aside className="lg:col-span-4 lg:border-l lg:border-white/[0.075] lg:pl-8">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Status</h3>
          <div className="mt-4 space-y-4">
            <StatusLine color="bg-amber-400" label="Pending" value={stats?.pendingTasks ?? 0} />
            <StatusLine color="bg-[#5B6CFF]" label="In progress" value={stats?.inProgressTasks ?? 0} />
            <StatusLine color="bg-emerald-400" label="Completed" value={stats?.completedTasks ?? 0} />
          </div>
          <p className="mt-5 border-t border-white/[0.065] pt-4 text-xs leading-5 text-[#71717A]">{stats?.totalTasks ? `${Math.round(stats.taskCompletionRate)}% of your tasks are complete.` : 'Your workspace is ready for its first task.'}</p>
        </aside>
      </div>

      <section>
        <SectionHeader title="Project progress" href="/projects" />
        {projectsQuery.isLoading ? <Skeleton className="mt-3 h-36" /> : projects.length ? (
          <div className="mt-1 grid grid-cols-1 gap-x-10 md:grid-cols-2">
            {projects.slice(0, 4).map((project) => {
              const projectTasks = allTasks.filter((task) => task.projectId === project.id);
              const completed = projectTasks.filter((task) => task.status === 'COMPLETED').length;
              const rate = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;
              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="group border-b border-white/[0.065] py-4">
                  <div className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#E8E8E6] transition-colors group-hover:text-white">{project.name}</p><p className="mt-1 text-xs text-[#71717A]">{completed} of {projectTasks.length} tasks complete</p></div><span className="text-sm font-medium tabular-nums text-[#A1A1AA]">{rate}%</span></div>
                  <div className="mt-3 h-0.5 overflow-hidden bg-white/[0.07]"><div className="progress-bar-fill h-full bg-[#5B6CFF]" style={{ width: `${rate}%` }} /></div>
                </Link>
              );
            })}
          </div>
        ) : <EmptyLine text="No projects yet. Start with one clear outcome." />}
      </section>
      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />
    </div>
  );
}

function Metric({ value, label, detail }: { value: number | string; label: string; detail: string }) {
  return <div className="px-3 first:pl-0 last:pr-0 sm:px-6"><div className="text-2xl font-semibold tracking-[-0.04em] tabular-nums sm:text-[28px]">{value}</div><div className="mt-1 text-xs font-medium text-[#A1A1AA]">{label}</div><div className="mt-0.5 hidden text-[11px] text-[#5f5f68] sm:block">{detail}</div></div>;
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return <div className="flex items-center justify-between border-b border-white/[0.075] pb-3"><h3 className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h3><Link href={href} className="focus-ring flex items-center gap-1.5 rounded-md text-xs text-[#8b8b94] transition-colors hover:text-white">View all<ArrowRight size={13} /></Link></div>;
}

function DashboardTaskRow({ task, projectName, onToggle, pending }: { task: Task; projectName?: string; onToggle: () => void; pending: boolean }) {
  const completed = task.status === 'COMPLETED';
  return (
    <div className="group flex min-h-[64px] items-center gap-3 py-2">
      <button onClick={onToggle} disabled={pending} className={`interactive-press focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-[var(--motion-fast)] ${completed ? 'border-emerald-400/60 bg-emerald-400 text-[#07120d]' : 'border-white/25 text-transparent hover:border-[#7483ff]'}`} aria-label={completed ? `Reopen ${task.name}` : `Complete ${task.name}`}><Check className="h-3 w-3" strokeWidth={3} /></button>
      <div className="min-w-0 flex-1"><p className={`task-state-change truncate text-sm font-medium ${completed ? 'text-[#71717A] line-through decoration-white/20' : 'text-[#E8E8E6]'}`}>{task.name}</p><div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-[#71717A]"><span className="truncate">{projectName || 'Project'}</span>{task.dueDate ? <><span aria-hidden="true">·</span><span className="flex shrink-0 items-center gap-1"><Clock size={11} />{formatDate(task.dueDate)}</span></> : null}{completed && task.completedAt ? <><span aria-hidden="true">·</span><span className="shrink-0 text-emerald-300/75">Completed {formatDate(task.completedAt)}</span></> : null}</div></div>
      <div className="hidden shrink-0 items-center gap-5 text-xs sm:flex"><span className={task.priority === 'HIGH' ? 'text-rose-300' : task.priority === 'MEDIUM' ? 'text-amber-300' : 'text-[#777781]'}>{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span><span className={task.status === 'COMPLETED' ? 'text-emerald-300' : task.status === 'IN_PROGRESS' ? 'text-[#8B98FF]' : 'text-[#8b8b94]'}>{task.status === 'IN_PROGRESS' ? 'In progress' : task.status.charAt(0) + task.status.slice(1).toLowerCase()}</span></div>
    </div>
  );
}

function StatusLine({ color, label, value }: { color: string; label: string; value: number }) {
  return <div className="flex items-center gap-3"><span className={`h-5 w-0.5 rounded-full ${color}`} /><span className="flex-1 text-sm text-[#A1A1AA]">{label}</span><span className="text-sm font-semibold tabular-nums">{value}</span></div>;
}

function EmptyLine({ text }: { text: string }) { return <p className="border-b border-white/[0.065] py-8 text-sm text-[#71717A]">{text}</p>; }

function DashboardSkeleton() {
  return <div className="space-y-8"><div className="space-y-2"><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-52" /></div><Skeleton className="h-24" /><div className="grid gap-8 lg:grid-cols-12"><Skeleton className="h-72 lg:col-span-8" /><Skeleton className="h-72 lg:col-span-4" /></div></div>;
}
