import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { TaskForm } from '../../../components/task-form';
import { SubpageHeader } from '../../../components/subpage-header';
import { Heading, Screen, SkeletonList, StatePanel } from '../../../components/ui';
import { ApiError } from '../../../lib/api/client';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { colors } from '../../../lib/theme';
import type { CreateTaskInput } from '../../../lib/types';

export default function NewTaskScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>(); const client = useQueryClient(); const [error, setError] = useState<string | null>(null);
  const projects = useQuery({ queryKey: ['projects', 'options'], queryFn: () => projectsApi.list({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' }) });
  const mutation = useMutation({ mutationFn: tasksApi.create, onSuccess: async (task) => { await Promise.all([client.invalidateQueries({ queryKey: ['tasks'] }), client.invalidateQueries({ queryKey: ['dashboard'] }), client.invalidateQueries({ queryKey: ['project', task.projectId] })]); router.replace({ pathname: '/tasks/[id]', params: { id: task.id } }); }, onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not create task.') });
  return <View style={styles.root}><SubpageHeader title="New task" /><Screen scroll>{projects.isLoading ? <SkeletonList /> : projects.error ? <StatePanel title="Projects unavailable" message="We need your projects before a task can be created." actionLabel="Retry" onAction={() => projects.refetch()} /> : <><Heading eyebrow="Task setup" title="Create a task" subtitle="Keep it concrete, owned by a project, and easy to finish." /><TaskForm projects={projects.data?.items || []} initialProjectId={projectId} submitLabel="Create task" loading={mutation.isPending} apiError={error} onSubmit={(input) => { setError(null); mutation.mutate(input as CreateTaskInput); }} /></>}</Screen></View>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas } });
