import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutAnimation, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { TaskCard } from '../../../components/cards';
import { Button, ChoiceChips, Heading, Screen, SearchField, SkeletonList, StatePanel } from '../../../components/ui';
import { ApiError } from '../../../lib/api/client';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { useDebouncedValue } from '../../../lib/hooks';
import { colors, radius, spacing } from '../../../lib/theme';
import type { TaskPriority, TaskStatus } from '../../../lib/types';

type Sort = 'createdAt' | 'dueDate' | 'name' | 'priority';

export default function TasksScreen() {
  const client = useQueryClient();
  const [search, setSearch] = useState(''); const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<TaskStatus | undefined>(); const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>(); const [sortBy, setSortBy] = useState<Sort>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); const [filtersOpen, setFiltersOpen] = useState(false);
  const projects = useQuery({ queryKey: ['projects', 'options'], queryFn: () => projectsApi.list({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' }) });
  const query = useInfiniteQuery({
    queryKey: ['tasks', { search: debouncedSearch, status, priority, projectId, sortBy, sortOrder }], initialPageParam: 1,
    queryFn: ({ pageParam }) => tasksApi.list({ search: debouncedSearch || undefined, status, priority, projectId, sortBy, sortOrder, page: pageParam, limit: 10 }),
    getNextPageParam: (last) => last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });
  const toggle = useMutation({
    mutationFn: ({ id, next }: { id: string; next: TaskStatus }) => tasksApi.update(id, { status: next }),
    onSuccess: async () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); await Promise.all([client.invalidateQueries({ queryKey: ['tasks'] }), client.invalidateQueries({ queryKey: ['dashboard'] }), client.invalidateQueries({ queryKey: ['project'] })]); },
  });
  const items = query.data?.pages.flatMap((page) => page.items) || []; const total = query.data?.pages[0]?.pagination.total || 0;
  const projectNames = new Map((projects.data?.items || []).map((project) => [project.id, project.name]));
  const network = query.error instanceof ApiError && query.error.isNetworkError; const hasFilters = Boolean(search || status || priority || projectId);
  const clear = () => { setSearch(''); setStatus(undefined); setPriority(undefined); setProjectId(undefined); };
  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={colors.accent} colors={[colors.accent]} />}>
      <Heading eyebrow="Execution" title="Tasks" subtitle={`${total} ${total === 1 ? 'task' : 'tasks'} across your projects`} right={<Button label="New" icon="add" full={false} onPress={() => router.push('/tasks/new')} />} />
      <View style={styles.controls}><SearchField value={search} onChangeText={setSearch} placeholder="Search tasks" /><Button label={filtersOpen ? 'Hide filters' : 'Filter & sort'} icon="options-outline" tone="secondary" onPress={() => setFiltersOpen((value) => !value)} /></View>
      {filtersOpen ? <View style={styles.filterPanel}>
        <ChoiceChips<TaskStatus> label="Status" value={status} onChange={setStatus} options={[{ value: 'PENDING', label: 'Pending' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'COMPLETED', label: 'Completed' }]} />
        <ChoiceChips<TaskPriority> label="Priority" value={priority} onChange={setPriority} options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }]} />
        {projects.data?.items.length ? <ChoiceChips label="Project" value={projectId} onChange={setProjectId} options={projects.data.items.map((project) => ({ value: project.id, label: project.name }))} /> : null}
        <ChoiceChips label="Sort by" value={sortBy} onChange={(value) => value && setSortBy(value)} options={[{ value: 'createdAt', label: 'Newest' }, { value: 'dueDate', label: 'Due date' }, { value: 'name', label: 'Name' }, { value: 'priority', label: 'Priority' }]} />
        <Button label={sortOrder === 'desc' ? 'Descending' : 'Ascending'} icon={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} tone="ghost" onPress={() => setSortOrder((value) => value === 'desc' ? 'asc' : 'desc')} />
      </View> : null}
      <View style={styles.resultsHeader}><Text style={styles.resultLabel}>{hasFilters ? `${total} matching` : 'All tasks'}</Text>{hasFilters ? <Button label="Clear" full={false} tone="ghost" onPress={clear} /> : null}</View>
      {query.isLoading ? <SkeletonList /> : query.error ? <StatePanel title={network ? 'You’re offline' : 'Tasks unavailable'} message={network ? 'Reconnect to load and update tasks.' : 'We couldn’t load this list. Please try again.'} actionLabel="Retry" onAction={() => query.refetch()} loading={query.isRefetching} /> : !items.length ? <StatePanel icon="checkmark-done-outline" title={hasFilters ? 'No tasks match' : 'Plan the next action'} message={hasFilters ? 'Try a broader search or clear your filters.' : 'Add a task to turn project momentum into a concrete next step.'} actionLabel={hasFilters ? 'Clear filters' : 'Create task'} onAction={hasFilters ? clear : () => router.push('/tasks/new')} /> : <View style={styles.list}>{items.map((task) => <TaskCard key={task.id} task={task} projectName={projectNames.get(task.projectId)} onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })} onToggle={() => toggle.mutate({ id: task.id, next: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })} />)}{query.hasNextPage ? <Button label={`Load more (${items.length} of ${total})`} tone="secondary" icon="chevron-down" onPress={() => query.fetchNextPage()} loading={query.isFetchingNextPage} /> : <View style={styles.end}><Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} /><Text style={styles.endText}>You’ve reached the end</Text></View>}</View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { gap: spacing.md }, filterPanel: { marginTop: spacing.md, padding: spacing.lg, gap: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  resultsHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, resultLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, list: { gap: spacing.sm },
  end: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg }, endText: { color: colors.textMuted, fontSize: 12 },
});
