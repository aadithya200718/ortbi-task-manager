import React from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubpageHeader } from '../../../components/subpage-header';
import { Button, Heading, Screen, SkeletonList, StatePanel, StatusBadge, uiStyles } from '../../../components/ui';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { colors, formatDate, spacing } from '../../../lib/theme';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const client = useQueryClient();
  const task = useQuery({ queryKey: ['task', id], queryFn: () => tasksApi.get(id) });
  const project = useQuery({ queryKey: ['project', task.data?.projectId], queryFn: () => projectsApi.get(task.data!.projectId), enabled: Boolean(task.data?.projectId) });
  const refreshAll = async () => { const result = await task.refetch(); if (result.data?.projectId) await project.refetch(); };
  const invalidate = async (projectId?: string) => { await Promise.all([client.invalidateQueries({ queryKey: ['task', id] }), client.invalidateQueries({ queryKey: ['tasks'] }), client.invalidateQueries({ queryKey: ['dashboard'] }), client.invalidateQueries({ queryKey: ['project', projectId] })]); };
  const toggle = useMutation({ mutationFn: () => tasksApi.update(id, { status: task.data?.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' }), onSuccess: async (updated) => invalidate(updated.projectId) });
  const remove = useMutation({ mutationFn: () => tasksApi.delete(id), onSuccess: async () => { await invalidate(task.data?.projectId); router.replace('/tasks'); } });
  const confirmDelete = () => Alert.alert('Delete this task?', 'This action cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete task', style: 'destructive', onPress: () => remove.mutate() }]);
  return <View style={styles.root}><SubpageHeader title="Task details" /><Screen scroll refreshControl={<RefreshControl refreshing={task.isRefetching || project.isRefetching} onRefresh={() => void refreshAll()} tintColor={colors.accent} colors={[colors.accent]} />}>{task.isLoading ? <SkeletonList /> : task.error || !task.data ? <StatePanel title="Task unavailable" message="It may have been removed, or the connection was interrupted." actionLabel="Retry" onAction={() => task.refetch()} /> : <>
    <Heading eyebrow="Task" title={task.data.name} subtitle={task.data.description || 'No description added.'} right={<StatusBadge value={task.data.priority} />} />
    <View style={styles.statusRow}><StatusBadge value={task.data.status} />{task.data.completedAt ? <Text style={styles.completedAt}>Completed {formatDate(task.data.completedAt)}</Text> : null}</View>
    <View style={styles.actionStack}><Button label={task.data.status === 'COMPLETED' ? 'Reopen task' : 'Mark complete'} icon={task.data.status === 'COMPLETED' ? 'refresh-outline' : 'checkmark'} onPress={() => toggle.mutate()} loading={toggle.isPending} /><Button label="Edit task" icon="create-outline" tone="secondary" onPress={() => router.push({ pathname: '/tasks/[id]/edit', params: { id } })} /></View>
    <View style={styles.infoCard}><Info label="Project" value={project.data?.name || (project.isLoading ? 'Loading…' : 'Project unavailable')} /><View style={styles.divider} /><Info label="Due date" value={formatDate(task.data.dueDate)} /><View style={styles.divider} /><Info label="Created" value={formatDate(task.data.createdAt)} /><View style={styles.divider} /><Info label="Last updated" value={formatDate(task.data.updatedAt)} /></View>
    {project.data ? <Button label="Open project" icon="folder-open-outline" tone="ghost" onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.data.id } })} /> : null}
    <View style={styles.dangerZone}><Text style={styles.dangerTitle}>Danger zone</Text><Text style={styles.dangerCopy}>Deleting this task removes it permanently from its project.</Text><Button label="Delete task" icon="trash-outline" tone="danger" onPress={confirmDelete} loading={remove.isPending} /></View>
  </>}</Screen></View>;
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: -spacing.md, marginBottom: spacing.xl }, completedAt: { color: colors.textMuted, fontSize: 12 }, actionStack: { gap: spacing.md }, infoCard: { ...uiStyles.card, marginTop: spacing.xl }, info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, minHeight: 52 }, infoLabel: { color: colors.textMuted, fontSize: 13 }, infoValue: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right', flexShrink: 1 }, divider: { height: 1, backgroundColor: colors.border },
  dangerZone: { marginTop: 42, borderTopWidth: 1, borderTopColor: '#4A2022', paddingTop: spacing.xl, gap: spacing.md }, dangerTitle: { color: '#FF8589', fontSize: 15, fontWeight: '800' }, dangerCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
