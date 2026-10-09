import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ProjectCard } from '../../../components/cards';
import { Button, ChoiceChips, Heading, Screen, SearchField, SkeletonList, StatePanel } from '../../../components/ui';
import { ApiError } from '../../../lib/api/client';
import { projectsApi } from '../../../lib/api/projects';
import { useDebouncedValue } from '../../../lib/hooks';
import { colors, radius, spacing } from '../../../lib/theme';
import type { ProjectStatus } from '../../../lib/types';

type Sort = 'createdAt' | 'name' | 'endDate';

export default function ProjectsScreen() {
  const [search, setSearch] = useState(''); const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<ProjectStatus | undefined>(); const [sortBy, setSortBy] = useState<Sort>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); const [filtersOpen, setFiltersOpen] = useState(false);
  const query = useInfiniteQuery({
    queryKey: ['projects', { search: debouncedSearch, status, sortBy, sortOrder }], initialPageParam: 1,
    queryFn: ({ pageParam }) => projectsApi.list({ search: debouncedSearch || undefined, status, sortBy, sortOrder, page: pageParam, limit: 10 }),
    getNextPageParam: (last) => last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });
  const projects = query.data?.pages.flatMap((page) => page.items) || [];
  const total = query.data?.pages[0]?.pagination.total || 0;
  const network = query.error instanceof ApiError && query.error.isNetworkError;
  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={colors.accent} colors={[colors.accent]} />}>
      <Heading eyebrow="Workspace" title="Projects" subtitle={`${total} ${total === 1 ? 'project' : 'projects'} in your orbit`} right={<Button label="New" icon="add" full={false} onPress={() => router.push('/projects/new')} />} />
      <View style={styles.controls}><SearchField value={search} onChangeText={setSearch} placeholder="Search projects" /><Button label={filtersOpen ? 'Hide filters' : 'Filter & sort'} icon="options-outline" tone="secondary" onPress={() => setFiltersOpen((value) => !value)} /></View>
      {filtersOpen ? <View style={styles.filterPanel}>
        <ChoiceChips<ProjectStatus> label="Status" value={status} onChange={setStatus} options={[{ value: 'NOT_STARTED', label: 'Not started' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'COMPLETED', label: 'Completed' }]} />
        <ChoiceChips label="Sort by" value={sortBy} onChange={(value) => value && setSortBy(value)} options={[{ value: 'createdAt', label: 'Newest' }, { value: 'name', label: 'Name' }, { value: 'endDate', label: 'Deadline' }]} />
        <Button label={sortOrder === 'desc' ? 'Descending' : 'Ascending'} icon={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} tone="ghost" onPress={() => setSortOrder((value) => value === 'desc' ? 'asc' : 'desc')} />
      </View> : null}
      <View style={styles.resultsHeader}><Text style={styles.resultLabel}>{search || status ? `${total} matching` : 'All projects'}</Text>{(search || status) ? <Button label="Clear" full={false} tone="ghost" onPress={() => { setSearch(''); setStatus(undefined); }} /> : null}</View>
      {query.isLoading ? <SkeletonList /> : query.error ? <StatePanel title={network ? 'You’re offline' : 'Projects unavailable'} message={network ? 'Reconnect to load your projects.' : 'We couldn’t load this list. Please try again.'} actionLabel="Retry" onAction={() => query.refetch()} loading={query.isRefetching} /> : !projects.length ? <StatePanel icon="folder-open-outline" title={search || status ? 'No projects match' : 'Start your first project'} message={search || status ? 'Try a broader search or clear your filters.' : 'Give your next initiative a name, a timeline, and a clear place to live.'} actionLabel={search || status ? 'Clear filters' : 'Create project'} onAction={() => search || status ? (setSearch(''), setStatus(undefined)) : router.push('/projects/new')} /> : <View style={styles.list}>{projects.map((project) => <ProjectCard key={project.id} project={project} onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })} />)}{query.hasNextPage ? <Button label={`Load more (${projects.length} of ${total})`} tone="secondary" icon="chevron-down" onPress={() => query.fetchNextPage()} loading={query.isFetchingNextPage} /> : <View style={styles.end}><Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} /><Text style={styles.endText}>You’ve reached the end</Text></View>}</View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { gap: spacing.md }, filterPanel: { marginTop: spacing.md, padding: spacing.lg, gap: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  resultsHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, resultLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  list: { gap: spacing.sm }, end: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg }, endText: { color: colors.textMuted, fontSize: 12 },
});
