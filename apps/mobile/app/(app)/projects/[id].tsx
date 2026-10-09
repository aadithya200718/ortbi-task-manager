import React from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskCard } from '../../../components/cards';
import { SubpageHeader } from '../../../components/subpage-header';
import { Button, Heading, Screen, SkeletonList, StatePanel, StatusBadge, uiStyles } from '../../../components/ui';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { colors, formatDate, radius, spacing } from '../../../lib/theme';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const client = useQueryClient();
  const project = useQuery({ queryKey: ['project', id], queryFn: () => projectsApi.get(id) });
  const tasks = useQuery({ queryKey: ['tasks', 'project', id], queryFn: () => tasksApi.list({ projectId: id, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }) });
  const remove = useMutation({ mutationFn: () => projectsApi.delete(id), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['projects'] }), client.invalidateQueries({ queryKey: ['tasks'] }), client.invalidateQueries({ queryKey: ['dashboard'] })]); router.replace('/projects'); } });
  const confirmDelete = () => Alert.alert('Delete this project?', 'All tasks inside it will also be deleted. This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete project', style: 'destructive', onPress: () => remove.mutate() }]);
  const refreshing = project.isRefetching || tasks.isRefetching; const refresh = () => { void Promise.all([project.refetch(), tasks.refetch()]); };
  const taskItems = tasks.data?.items || []; const completed = taskItems.filter((task) => task.status === 'COMPLETED').length; const progress = taskItems.length ? Math.round((completed / taskItems.length) * 100) : 0;
  return <View style={styles.root}><SubpageHeader title="Project details" /><Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} />}>{project.isLoading ? <SkeletonList /> : project.error || !project.data ? <StatePanel title="Project unavailable" message="It may have been removed, or the connection was interrupted." actionLabel="Retry" onAction={refresh} /> : <>
    <Heading eyebrow="Project" title={project.data.name} subtitle={project.data.description || 'No description added.'} right={<StatusBadge value={project.data.status} />} />
    <View style={styles.actionRow}><View style={styles.action}><Button label="Edit" icon="create-outline" tone="secondary" onPress={() => router.push({ pathname: '/projects/[id]/edit', params: { id } })} /></View><View style={styles.action}><Button label="Add task" icon="add" onPress={() => router.push({ pathname: '/tasks/new', params: { projectId: id } })} /></View></View>
    <View style={styles.progressCard}><View style={styles.between}><View><Text style={styles.overline}>Project progress</Text><Text style={styles.progressValue}>{progress}%</Text></View><Text style={styles.progressMeta}>{completed} / {taskItems.length} complete</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View></View>
    <View style={styles.infoGrid}><Info label="Start date" value={formatDate(project.data.startDate)} /><Info label="End date" value={formatDate(project.data.endDate)} /><Info label="Created" value={formatDate(project.data.createdAt)} /><Info label="Last updated" value={formatDate(project.data.updatedAt)} /></View>
    <View style={styles.sectionHeader}><Text style={uiStyles.sectionTitle}>Tasks</Text><Text style={styles.count}>{taskItems.length}</Text></View>
    {tasks.isLoading ? <SkeletonList /> : tasks.error ? <StatePanel title="Tasks unavailable" message="Project details loaded, but its tasks did not." actionLabel="Retry" onAction={() => tasks.refetch()} /> : taskItems.length ? <View style={styles.list}>{taskItems.map((task) => <TaskCard key={task.id} task={task} onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })} />)}</View> : <StatePanel icon="checkmark-done-outline" title="No tasks in this project" message="Add the first action and start building momentum." actionLabel="Add task" onAction={() => router.push({ pathname: '/tasks/new', params: { projectId: id } })} />}
    <View style={styles.dangerZone}><Text style={styles.dangerTitle}>Danger zone</Text><Text style={styles.dangerCopy}>Deleting this project also permanently removes every task inside it.</Text><Button label="Delete project" icon="trash-outline" tone="danger" onPress={confirmDelete} loading={remove.isPending} /></View>
  </>}</Screen></View>;
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, actionRow: { flexDirection: 'row', gap: spacing.md }, action: { flex: 1 }, progressCard: { ...uiStyles.card, marginTop: spacing.xl, gap: spacing.md }, between: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, overline: { color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, progressValue: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 2 }, progressMeta: { color: colors.textSecondary, fontSize: 11 }, track: { height: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.elevated }, fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md }, info: { width: '47.9%', minHeight: 82, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.md }, infoLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }, infoValue: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xxl, marginBottom: spacing.md }, count: { color: colors.textMuted, fontSize: 12, fontWeight: '800', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.raised }, list: { gap: spacing.sm },
  dangerZone: { marginTop: 42, borderTopWidth: 1, borderTopColor: '#4A2022', paddingTop: spacing.xl, gap: spacing.md }, dangerTitle: { color: '#FF8589', fontSize: 15, fontWeight: '800' }, dangerCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
