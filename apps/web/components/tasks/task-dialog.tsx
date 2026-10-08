'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, X } from 'lucide-react';
import { ApiError } from '../../lib/api/client';
import { projectsApi } from '../../lib/api/projects';
import { tasksApi } from '../../lib/api/tasks';
import { CreateTaskInput, Project, Task, TaskPriority, TaskStatus, UpdateTaskInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
  onSuccess?: (task: Task) => void;
}

export function TaskDialog({ open, onOpenChange, task, defaultProjectId, onSuccess }: TaskDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(task);
  const { data: projectsData } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ limit: 100 }),
    enabled: open && !isEditing,
  });
  const projects = useMemo(() => projectsData?.items || [], [projectsData?.items]);

  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setProjectId(task?.projectId || defaultProjectId || projects[0]?.id || '');
    setName(task?.name || '');
    setDescription(task?.description || '');
    setPriority(task?.priority || 'MEDIUM');
    setStatus(task?.status || 'PENDING');
    setDueDate(task?.dueDate?.split('T')[0] || '');
    setErrorMessage(null);
    setFieldErrors({});
  }, [defaultProjectId, open, projects, task]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onOpenChange(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [onOpenChange, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (task) {
        const payload: UpdateTaskInput = { name: name.trim(), description: description.trim() || undefined, priority, status, dueDate: dueDate || undefined };
        return tasksApi.updateTask(task.id, payload);
      }
      const payload: CreateTaskInput = { projectId, name: name.trim(), description: description.trim() || undefined, priority, status, dueDate: dueDate || undefined };
      return tasksApi.createTask(payload);
    },
    onSuccess: (savedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', savedTask.projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-preview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess?.(savedTask);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.errors) {
        const nextErrors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) nextErrors[key] = messages[0] || 'Invalid value';
        setFieldErrors(nextErrors);
      }
      setErrorMessage(error.message || 'Unable to save this task.');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!task && !projectId) nextErrors.projectId = 'Select a project';
    if (!name.trim()) nextErrors.name = 'Task name is required';
    setFieldErrors(nextErrors);
    setErrorMessage(null);
    if (Object.keys(nextErrors).length === 0) mutation.mutate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="fade-in absolute inset-0 bg-black/70" onClick={() => onOpenChange(false)} aria-label="Close task form" />
      <section role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" className="sheet-slide-up relative z-10 mt-auto flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-xl border-t border-white/[0.09] bg-[#151517] shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:mt-0 md:max-h-dvh md:max-w-[440px] md:rounded-none md:border-l md:border-t-0">
        <header className="flex items-start justify-between gap-6 border-b border-white/[0.07] p-5 sm:p-6">
          <div><h2 id="task-dialog-title" className="text-lg font-semibold tracking-[-0.02em]">{isEditing ? 'Edit task' : 'New task'}</h2><p className="mt-1 text-xs leading-5 text-[#8b8b94]">{isEditing ? 'Update this task without changing its project.' : 'Add focused work to a project.'}</p></div>
          <button onClick={() => onOpenChange(false)} className="focus-ring rounded-md p-1.5 text-[#71717A] hover:bg-white/[0.05] hover:text-white" aria-label="Close"><X size={17} /></button>
        </header>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 p-5 sm:p-6" noValidate>
          {errorMessage ? <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{errorMessage}</div> : null}
          {!isEditing && !defaultProjectId ? (
            <Select id="task-project" label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)} error={fieldErrors.projectId} options={projects.length ? projects.map((project: Project) => ({ value: project.id, label: project.name })) : [{ value: '', label: 'Create a project first' }]} />
          ) : null}
          {isEditing ? <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-xs text-[#8b8b94]">Project assignment stays fixed after task creation.</div> : null}
          <Input id="task-name" label="Task name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Prepare design handoff" maxLength={255} error={fieldErrors.name} autoFocus />
          <Textarea id="task-description" label="Description" hint="Optional" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add context or an expected outcome." maxLength={5000} />
          <div className="grid grid-cols-2 gap-3">
            <Select id="task-priority" label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }]} />
            <Select id="task-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} options={[{ value: 'PENDING', label: 'Pending' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'COMPLETED', label: 'Completed' }]} />
          </div>
          <Input id="task-due" label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          <div className="mt-auto flex justify-end gap-2 border-t border-white/[0.07] pt-5">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={mutation.isPending}>{isEditing ? 'Save changes' : 'Create task'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
