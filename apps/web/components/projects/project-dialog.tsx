'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, X } from 'lucide-react';
import { ApiError } from '../../lib/api/client';
import { projectsApi } from '../../lib/api/projects';
import { CreateProjectInput, Project, ProjectStatus, UpdateProjectInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSuccess?: (project: Project) => void;
}

export function ProjectDialog({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(project);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('NOT_STARTED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(project?.name || '');
    setDescription(project?.description || '');
    setStatus(project?.status || 'NOT_STARTED');
    setStartDate(project?.startDate?.split('T')[0] || '');
    setEndDate(project?.endDate?.split('T')[0] || '');
    setErrorMessage(null);
    setFieldErrors({});
  }, [open, project]);

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
      const payload: CreateProjectInput | UpdateProjectInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      return project ? projectsApi.updateProject(project.id, payload) : projectsApi.createProject(payload as CreateProjectInput);
    },
    onSuccess: (savedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects-lookup'] });
      queryClient.invalidateQueries({ queryKey: ['projects-select'] });
      queryClient.invalidateQueries({ queryKey: ['project', savedProject.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess?.(savedProject);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.errors) {
        const nextErrors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) nextErrors[key] = messages[0] || 'Invalid value';
        setFieldErrors(nextErrors);
      }
      setErrorMessage(error.message || 'Unable to save this project.');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Project name is required';
    if (startDate && endDate && endDate < startDate) nextErrors.endDate = 'End date must be on or after the start date';
    setFieldErrors(nextErrors);
    setErrorMessage(null);
    if (Object.keys(nextErrors).length === 0) mutation.mutate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="fade-in absolute inset-0 bg-black/70" onClick={() => onOpenChange(false)} aria-label="Close project form" />
      <section role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" className="sheet-slide-up relative z-10 mt-auto flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-xl border-t border-white/[0.09] bg-[#151517] shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:mt-0 md:max-h-dvh md:max-w-[440px] md:rounded-none md:border-l md:border-t-0 md:sheet-slide-right">
        <header className="flex items-start justify-between gap-6 border-b border-white/[0.07] p-5 sm:p-6">
          <div><h2 id="project-dialog-title" className="text-lg font-semibold tracking-[-0.02em]">{isEditing ? 'Edit project' : 'New project'}</h2><p className="mt-1 text-xs leading-5 text-[#8b8b94]">{isEditing ? 'Update the project scope and timeline.' : 'Create a focused place for related tasks.'}</p></div>
          <button onClick={() => onOpenChange(false)} className="focus-ring rounded-md p-1.5 text-[#71717A] hover:bg-white/[0.05] hover:text-white" aria-label="Close"><X size={17} /></button>
        </header>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 p-5 sm:p-6" noValidate>
          {errorMessage ? <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{errorMessage}</div> : null}
          <Input id="project-name" label="Project name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Website redesign" maxLength={255} error={fieldErrors.name} autoFocus />
          <Textarea id="project-description" label="Description" hint="Optional" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What outcome should this project deliver?" maxLength={5000} />
          <Select id="project-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} options={[{ value: 'NOT_STARTED', label: 'Planned' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'COMPLETED', label: 'Completed' }]} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="project-start" label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input id="project-end" label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} error={fieldErrors.endDate} />
          </div>
          <div className="mt-auto flex justify-end gap-2 border-t border-white/[0.07] pt-5">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={mutation.isPending}>{isEditing ? 'Save changes' : 'Create project'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
