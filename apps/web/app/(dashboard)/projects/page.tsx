'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Edit2, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { ProjectDialog } from '../../../components/projects/project-dialog';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { Skeleton } from '../../../components/ui/skeleton';
import { projectsApi } from '../../../lib/api/projects';
import { formatDate } from '../../../lib/utils';
import { Project, ProjectQueryParams, ProjectStatus } from '../../../types';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [sortBy, setSortBy] = useState<ProjectQueryParams['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const queryParams: ProjectQueryParams = { search: debouncedSearch || undefined, status: statusFilter === 'ALL' ? undefined : statusFilter, sortBy, sortOrder, page, limit: 8 };
  const projectsQuery = useQuery({ queryKey: ['projects', queryParams], queryFn: () => projectsApi.getProjects(queryParams) });
  const deleteProject = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeletingProject(null);
    },
  });
  const projects = projectsQuery.data?.items || [];
  const pagination = projectsQuery.data?.pagination;

  const openCreate = () => { setEditingProject(null); setDialogOpen(true); };
  const resetFilters = () => { setSearchTerm(''); setStatusFilter('ALL'); setSortBy('createdAt'); setSortOrder('desc'); setPage(1); };

  return (
    <div className="min-w-0 space-y-7 overflow-hidden">
      <header className="flex items-end justify-between gap-4">
        <div><h2 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[32px]">Projects</h2><p className="mt-1.5 text-sm text-[#8b8b94]">Manage work, progress, and delivery across your projects.</p></div>
        <Button className="hidden sm:inline-flex" size="sm" onClick={openCreate}><Plus size={14} />New project</Button>
      </header>

      <section aria-label="Project filters" className="min-w-0 space-y-2.5 lg:flex lg:items-center lg:gap-2.5 lg:space-y-0">
        <div className="relative min-w-0 lg:w-[420px] lg:shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64646d]" strokeWidth={1.7} />
          <input aria-label="Search projects" className="field-control search-field w-full text-[#F5F5F4] placeholder:text-[#64646d]" placeholder="Search projects" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
        <div className="flex max-w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:flex-1 lg:pb-0">
          <CompactSelect label="Status" value={statusFilter} onChange={(value) => { setStatusFilter(value as 'ALL' | ProjectStatus); setPage(1); }} options={[['ALL', 'All statuses'], ['IN_PROGRESS', 'In progress'], ['NOT_STARTED', 'Planned'], ['COMPLETED', 'Completed']]} />
          <CompactSelect label="Sort" value={sortBy || 'createdAt'} onChange={(value) => { setSortBy(value as ProjectQueryParams['sortBy']); setPage(1); }} options={[['createdAt', 'Created'], ['name', 'Name'], ['startDate', 'Start date'], ['endDate', 'End date']]} />
          <CompactSelect label="Order" value={sortOrder} onChange={(value) => { setSortOrder(value as 'asc' | 'desc'); setPage(1); }} options={[['desc', 'Newest first'], ['asc', 'Oldest first']]} />
        </div>
      </section>

      {projectsQuery.isLoading ? <ProjectListSkeleton /> : projectsQuery.isError ? (
        <StatePanel icon={<AlertCircle size={19} />} title="Unable to load projects" body={projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Please try again.'}><Button size="sm" variant="outline" onClick={() => projectsQuery.refetch()}>Retry</Button></StatePanel>
      ) : projects.length === 0 ? (
        <StatePanel icon={<FolderOpen size={19} />} title="No projects found" body={debouncedSearch || statusFilter !== 'ALL' ? 'Adjust your search or filters.' : 'Create a project to group tasks around a clear outcome.'}>{debouncedSearch || statusFilter !== 'ALL' ? <Button size="sm" variant="outline" onClick={resetFilters}>Reset filters</Button> : <Button size="sm" onClick={openCreate}><Plus size={14} />Create project</Button>}</StatePanel>
      ) : (
        <section aria-label="Projects" className="border-t border-white/[0.075]">
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_175px_70px] gap-6 border-b border-white/[0.075] px-2 py-2.5 text-[11px] font-medium text-[#64646d] md:grid"><span>Project</span><span>Status</span><span>Dates</span><span /></div>
          <div className="divide-y divide-white/[0.065]">
            {projects.map((project) => <ProjectRow key={project.id} project={project} onEdit={() => { setEditingProject(project); setDialogOpen(true); }} onDelete={() => setDeletingProject(project)} />)}
          </div>
        </section>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <footer className="flex items-center justify-between text-xs text-[#71717A]"><span>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span><div className="flex items-center gap-1"><button className="focus-ring rounded-lg border border-white/[0.08] p-2 hover:bg-white/[0.04] disabled:opacity-30" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><ChevronLeft size={15} /></button><span className="px-2 tabular-nums">{page} / {pagination.totalPages}</span><button className="focus-ring rounded-lg border border-white/[0.08] p-2 hover:bg-white/[0.04] disabled:opacity-30" onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} disabled={page >= pagination.totalPages}><ChevronRight size={15} /></button></div></footer>
      ) : null}

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editingProject} />
      <ConfirmDialog open={Boolean(deletingProject)} onOpenChange={(open) => { if (!open) setDeletingProject(null); }} title="Delete project" description={`Delete ${deletingProject?.name || 'this project'} and all of its tasks? This cannot be undone.`} confirmText="Delete project" isLoading={deleteProject.isPending} onConfirm={() => { if (deletingProject) deleteProject.mutate(deletingProject.id); }} />
    </div>
  );
}

function CompactSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="relative shrink-0"><span className="sr-only">{label}</span><select className="h-9 appearance-none rounded-lg border border-white/[0.09] bg-[#141416] py-0 pl-3 pr-8 text-xs text-[#C4C4CA] outline-none transition-colors hover:border-white/[0.15] focus:border-[#5B6CFF]" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#64646d]">⌄</span></label>;
}

function ProjectRow({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  const status = project.status === 'COMPLETED' ? 'Completed' : project.status === 'IN_PROGRESS' ? 'In progress' : 'Planned';
  const statusColor = project.status === 'COMPLETED' ? 'bg-emerald-400' : project.status === 'IN_PROGRESS' ? 'bg-[#5B6CFF]' : 'bg-[#71717A]';
  const dates = project.startDate || project.endDate ? `${project.startDate ? formatDate(project.startDate) : 'No start'} - ${project.endDate ? formatDate(project.endDate) : 'No end'}` : 'No dates';
  return (
    <article className="group relative grid min-h-[64px] gap-3 px-2 py-3 transition-colors hover:bg-white/[0.026] md:grid-cols-[minmax(0,1fr)_140px_175px_70px] md:items-center md:gap-6">
      <Link href={`/projects/${project.id}`} className="absolute inset-0 focus:outline-none" aria-label={`View ${project.name}`} />
      <div className="min-w-0"><h3 className="truncate text-[15px] font-medium text-[#E8E8E6] transition-colors group-hover:text-white">{project.name}</h3><p className="mt-1 line-clamp-1 max-w-[68ch] text-xs leading-5 text-[#71717A]">{project.description || 'No description'}</p></div>
      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]"><span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />{status}</div>
      <time className="text-xs tabular-nums text-[#71717A]">{dates}</time>
      <div className="relative z-10 flex items-center justify-end gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"><button onClick={onEdit} className="focus-ring rounded-md p-2 text-[#71717A] hover:bg-white/[0.05] hover:text-white" aria-label={`Edit ${project.name}`}><Edit2 size={15} /></button><button onClick={onDelete} className="focus-ring rounded-md p-2 text-[#71717A] hover:bg-rose-500/[0.08] hover:text-rose-300" aria-label={`Delete ${project.name}`}><Trash2 size={15} /></button><ArrowRight size={15} className="ml-1 text-[#64646d]" /></div>
    </article>
  );
}

function StatePanel({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return <div className="mx-auto max-w-md border-y border-white/[0.075] py-10 text-center"><span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-[#8b8b94]">{icon}</span><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#71717A]">{body}</p><div className="mt-4">{children}</div></div>;
}

function ProjectListSkeleton() { return <div className="space-y-1 border-t border-white/[0.075] pt-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[82px]" />)}</div>; }
