import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { ProjectForm } from '../../../../components/project-form';
import { SubpageHeader } from '../../../../components/subpage-header';
import { Heading, Screen, SkeletonList, StatePanel } from '../../../../components/ui';
import { ApiError } from '../../../../lib/api/client';
import { projectsApi } from '../../../../lib/api/projects';
import { colors } from '../../../../lib/theme';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const client = useQueryClient(); const [error, setError] = useState<string | null>(null);
  const project = useQuery({ queryKey: ['project', id], queryFn: () => projectsApi.get(id) });
  const mutation = useMutation({ mutationFn: (input: Parameters<typeof projectsApi.update>[1]) => projectsApi.update(id, input), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['project', id] }), client.invalidateQueries({ queryKey: ['projects'] }), client.invalidateQueries({ queryKey: ['dashboard'] })]); router.back(); }, onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not update project.') });
  return <View style={styles.root}><SubpageHeader title="Edit project" /><Screen scroll>{project.isLoading ? <SkeletonList /> : project.error || !project.data ? <StatePanel title="Project unavailable" message="We couldn’t load this project." actionLabel="Retry" onAction={() => project.refetch()} /> : <><Heading eyebrow="Project settings" title="Edit project" subtitle="Keep its scope, status, and timeline accurate." /><ProjectForm project={project.data} submitLabel="Save changes" loading={mutation.isPending} apiError={error} onSubmit={(input) => { setError(null); mutation.mutate(input); }} /></>}</Screen></View>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas } });
