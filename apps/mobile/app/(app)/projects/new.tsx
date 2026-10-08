import React, { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { ProjectForm } from '../../../components/project-form';
import { SubpageHeader } from '../../../components/subpage-header';
import { Heading, Screen } from '../../../components/ui';
import { ApiError } from '../../../lib/api/client';
import { projectsApi } from '../../../lib/api/projects';
import { colors } from '../../../lib/theme';

export default function NewProjectScreen() {
  const client = useQueryClient(); const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: projectsApi.create, onSuccess: async (project) => { await Promise.all([client.invalidateQueries({ queryKey: ['projects'] }), client.invalidateQueries({ queryKey: ['dashboard'] })]); router.replace({ pathname: '/projects/[id]', params: { id: project.id } }); }, onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not create project.') });
  return <View style={styles.root}><SubpageHeader title="New project" /><Screen scroll><Heading eyebrow="Project setup" title="Create a project" subtitle="Define the work, then add tasks when you’re ready." /><ProjectForm submitLabel="Create project" loading={mutation.isPending} apiError={error} onSubmit={(input) => { setError(null); mutation.mutate(input); }} /></Screen></View>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas } });
