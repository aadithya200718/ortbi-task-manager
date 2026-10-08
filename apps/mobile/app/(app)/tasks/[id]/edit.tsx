import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { TaskForm } from '../../../../components/task-form';
import { SubpageHeader } from '../../../../components/subpage-header';
import { Heading, Screen, SkeletonList, StatePanel } from '../../../../components/ui';
import { ApiError } from '../../../../lib/api/client';
import { projectsApi } from '../../../../lib/api/projects';
import { tasksApi } from '../../../../lib/api/tasks';
import { colors } from '../../../../lib/theme';
import type { UpdateTaskInput } from '../../../../lib/types';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const client = useQueryClient(); const [error, setError] = useState<string | null>(null);
  const task = useQuery({ queryKey: ['task', id], queryFn: () => tasksApi.get(id) });
  const projects = useQuery({ queryKey: ['projects', 'options'], queryFn: () => projectsApi.list({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' }) });
  const mutation = useMutation({ mutationFn: (input: UpdateTaskInput) => tasksApi.update(id, input), onSuccess: async (updated) => { await Promise.all([client.invalidateQueries({ queryKey: ['task', id] }), client.invalidateQueries({ queryKey: ['tasks'] }), client.invalidateQueries({ queryKey: ['dashboard'] }), client.invalidateQueries({ queryKey: ['project', updated.projectId] })]); router.back(); }, onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not update task.') });
  const pending = task.isLoading || projects.isLoading; const failed = task.error || projects.error || !task.data;
  return <View style={styles.root}><SubpageHeader title="Edit task" /><Screen scroll>{pending ? <SkeletonList /> : failed ? <StatePanel title="Task unavailable" message="We couldn’t load everything needed to edit this task." actionLabel="Retry" onAction={() => { void task.refetch(); void projects.refetch(); }} /> : <><Heading eyebrow="Task settings" title="Edit task" subtitle="Update the work without changing its project ownership." /><TaskForm task={task.data} projects={projects.data?.items || []} submitLabel="Save changes" loading={mutation.isPending} apiError={error} onSubmit={(input) => { setError(null); mutation.mutate(input as UpdateTaskInput); }} /></>}</Screen></View>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas } });
