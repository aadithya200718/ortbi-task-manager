'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Calendar, Check, Edit2, Plus, Trash2 } from 'lucide-react';
import { ProjectDialog } from '../../../../components/projects/project-dialog';
import { TaskDialog } from '../../../../components/tasks/task-dialog';
import { Button } from '../../../../components/ui/button';
import { ConfirmDialog } from '../../../../components/ui/confirm-dialog';
import { Skeleton } from '../../../../components/ui/skeleton';
import { projectsApi } from '../../../../lib/api/projects';
import { tasksApi } from '../../../../lib/api/tasks';
import { formatDate, formatDateTime } from '../../../../lib/utils';
import { PaginatedTasksResponse, Task, TaskStatus } from '../../../../types';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const projectQuery = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.getProjectById(projectId), enabled: Boolean(projectId) });
  const tasksQuery = useQuery({ queryKey: ['project-tasks', projectId], queryFn: () => tasksApi.getTasks({ projectId, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }), enabled: Boolean(projectId) });
  const deleteProject = useMutation({ mutationFn: () => projectsApi.deleteProject(projectId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); router.push('/projects'); } });
  const deleteTask = useMutation({ mutationFn: (id: string) => tasksApi.deleteTask(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] }); queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); setDeletingTask(null); } });
  const toggleTask = useMutation({
    mutationFn: ({ task, nextStatus }: { task: Task; nextStatus: TaskStatus }) => tasksApi.updateTask(task.id, { status: nextStatus }),
    onMutate: async ({ task, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['project-tasks', projectId] });
      const previous = queryClient.getQueryData<PaginatedTasksResponse>(['project-tasks', projectId]);
      queryClient.setQueryData<PaginatedTasksResponse>(['project-tasks', projectId], (current) => current ? { ...current, items: current.items.map((item) => item.id === task.id ? { ...item, status: nextStatus, completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : null } : item) } : current);
      return { previous };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(['project-tasks', projectId], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] }); queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); },
  });

  if (projectQuery.isLoading) return <div className="mx-auto max-w-[960px] space-y-6"><Skeleton className="h-5 w-24" /><Skeleton className="h-52" /><Skeleton className="h-64" /></div>;
  if (projectQuery.isError || !projectQuery.data) {
    return <div className="mx-auto max-w-md border-y border-white/[0.075] py-12 text-center"><AlertCircle className="mx-auto h-5 w-5 text-amber-300" /><h2 className="mt-3 text-base font-semibold">Project not found</h2><p className="mt-1 text-sm leading-6 text-[#71717A]">It may have been deleted or you may not have access.</p><Link className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-2 text-xs text-[#A1A1AA] hover:text-white" href="/projects"><ArrowLeft size={14} />Back to projects</Link></div>;
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data?.items || [];
  const completedCount = tasks.filter((task) => task.status === 'COMPLETED').length;
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const statusLabel = project.status === 'COMPLETED' ? 'Completed' : project.status === 'IN_PROGRESS' ? 'In progress' : 'Planned';
  const statusClass = project.status === 'COMPLETED' ? 'text-emerald-300' : project.status === 'IN_PROGRESS' ? 'text-[#8B98FF]' : 'text-[#8b8b94]';

  return (
    <div className="mx-auto max-w-[960px] space-y-8 pb-8">
      <div className="flex items-center justify-between gap-4"><Link href="/projects" className="focus-ring inline-flex items-center gap-1.5 rounded-md text-xs text-[#8b8b94] transition-colors hover:text-white"><ArrowLeft size={14} />Projects</Link><div className="flex items-center gap-2"><Button size="sm" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}><Plus size={14} />Add task</Button><Button size="sm" variant="outline" onClick={() => setProjectDialogOpen(true)}><Edit2 size={14} /><span className="hidden sm:inline">Edit</span></Button><button onClick={() => setDeleteProjectOpen(true)} className="focus-ring rounded-lg p-2 text-[#71717A] transition-colors hover:bg-rose-500/[0.08] hover:text-rose-300" aria-label="Delete project"><Trash2 size={16} /></button></div></div>

      <header className="border-b border-white/[0.075] pb-7">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-[28px] font-semibold leading-tight tracking-[-0.04em] sm:text-[34px]">{project.name}</h2><span className={`text-xs font-medium ${statusClass}`}>{statusLabel}</span></div>
        <p className="mt-3 max-w-[68ch] text-sm leading-6 text-[#A1A1AA]">{project.description || 'No description added.'}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#71717A]"><span className="flex items-center gap-1.5"><Calendar size={13} />{project.startDate ? formatDate(project.startDate) : 'No start date'} - {project.endDate ? formatDate(project.endDate) : 'No end date'}</span><span>Created {formatDate(project.createdAt)}</span></div>
      </header>

      <section aria-label="Project progress" className="border-b border-white/[0.075] pb-7"><div className="flex items-end justify-between gap-4"><div><h3 className="text-[17px] font-semibold tracking-[-0.02em]">Progress</h3><p className="mt-1 text-xs text-[#71717A]">{completedCount} of {tasks.length} tasks complete</p></div><span className="text-2xl font-semibold tracking-[-0.035em] tabular-nums">{completionRate}%</span></div><div className="mt-4 h-1 overflow-hidden bg-white/[0.07]"><div className="progress-bar-fill h-full bg-[#5B6CFF]" style={{ width: `${completionRate}%` }} /></div></section>

      <section>
        <div className="flex items-center justify-between border-b border-white/[0.075] pb-3"><h3 className="text-[17px] font-semibold tracking-[-0.02em]">Tasks <span className="ml-1 text-sm font-normal text-[#64646d]">{tasks.length}</span></h3><button onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }} className="focus-ring rounded-md text-xs font-medium text-[#8B98FF] hover:text-white">Add task</button></div>
        {tasksQuery.isLoading ? <div className="mt-2 space-y-1"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : tasks.length ? <div className="divide-y divide-white/[0.065]">{tasks.map((task) => <ProjectTaskRow key={task.id} task={task} pending={toggleTask.isPending && toggleTask.variables?.task.id === task.id} onToggle={() => toggleTask.mutate({ task, nextStatus: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })} onEdit={() => { setEditingTask(task); setTaskDialogOpen(true); }} onDelete={() => setDeletingTask(task)} />)}</div> : <div className="border-b border-white/[0.065] py-10 text-center"><p className="text-sm text-[#71717A]">No tasks in this project yet.</p><Button className="mt-4" size="sm" variant="outline" onClick={() => setTaskDialogOpen(true)}><Plus size={14} />Add first task</Button></div>}
      </section>

      <ProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} project={project} />
      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} task={editingTask} defaultProjectId={projectId} />
      <ConfirmDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen} title="Delete project" description={`Delete ${project.name} and all of its tasks? This cannot be undone.`} confirmText="Delete project" isLoading={deleteProject.isPending} onConfirm={() => deleteProject.mutate()} />
      <ConfirmDialog open={Boolean(deletingTask)} onOpenChange={(open) => { if (!open) setDeletingTask(null); }} title="Delete task" description={`Delete ${deletingTask?.name || 'this task'}? This cannot be undone.`} confirmText="Delete task" isLoading={deleteTask.isPending} onConfirm={() => { if (deletingTask) deleteTask.mutate(deletingTask.id); }} />
    </div>
  );
}

function ProjectTaskRow({ task, pending, onToggle, onEdit, onDelete }: { task: Task; pending: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const completed = task.status === 'COMPLETED';
  const statusLabel = task.status === 'IN_PROGRESS' ? 'In progress' : task.status.charAt(0) + task.status.slice(1).toLowerCase();
  return (
    <article className="group flex min-h-[66px] items-center gap-3 py-2.5">
      <button onClick={onToggle} disabled={pending} className={`interactive-press focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color] ${completed ? 'border-emerald-400/60 bg-emerald-400 text-[#07120d]' : 'border-white/25 text-transparent hover:border-[#7483ff]'}`} aria-label={completed ? `Reopen ${task.name}` : `Complete ${task.name}`}><Check size={12} strokeWidth={3} /></button>
      <div className="min-w-0 flex-1"><h4 className={`task-state-change truncate text-sm font-medium ${completed ? 'text-[#71717A] line-through decoration-white/20' : 'text-[#E8E8E6]'}`}>{task.name}</h4><div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#71717A]"><span className={task.priority === 'HIGH' ? 'text-rose-300' : task.priority === 'MEDIUM' ? 'text-amber-300' : 'text-[#8b8b94]'}>{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span><span>·</span><span>{statusLabel}</span>{task.dueDate ? <><span>·</span><span>Due {formatDate(task.dueDate)}</span></> : null}{task.completedAt ? <><span>·</span><span className="text-emerald-300/70">Completed {formatDateTime(task.completedAt)}</span></> : null}</div></div>
      <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><button onClick={onEdit} className="focus-ring rounded-md p-2 text-[#71717A] hover:bg-white/[0.05] hover:text-white" aria-label={`Edit ${task.name}`}><Edit2 size={15} /></button><button onClick={onDelete} className="focus-ring rounded-md p-2 text-[#71717A] hover:bg-rose-500/[0.08] hover:text-rose-300" aria-label={`Delete ${task.name}`}><Trash2 size={15} /></button></div>
    </article>
  );
}
