import React from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, Heading, Screen, SkeletonList, StatePanel, uiStyles } from '../../../components/ui';
import { ProjectCard, TaskCard } from '../../../components/cards';
import { dashboardApi } from '../../../lib/api/dashboard';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { ApiError } from '../../../lib/api/client';
import { colors, spacing } from '../../../lib/theme';
import { useAuth } from '../../../providers/auth-provider';

export default function DashboardScreen() {
  const { user } = useAuth();
  const stats = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  const projects = useQuery({ queryKey: ['projects', 'dashboard'], queryFn: () => projectsApi.list({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' }) });
  const tasks = useQuery({ queryKey: ['tasks', 'dashboard'], queryFn: () => tasksApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }) });
  const refreshing = stats.isRefetching || projects.isRefetching || tasks.isRefetching;
  const refresh = () => { void Promise.all([stats.refetch(), projects.refetch(), tasks.refetch()]); };
  const error = stats.error || projects.error || tasks.error;
  const network = error instanceof ApiError && error.isNetworkError;
  const projectNames = new Map((projects.data?.items || []).map((project) => [project.id, project.name]));

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} />}>
      <Heading eyebrow="Overview" title={`Good day, ${user?.fullName.split(' ')[0] || 'there'}`} subtitle="Here is where your work stands." />
      {error ? <StatePanel title={network ? 'You’re offline' : 'Couldn’t load your workspace'} message={network ? 'Orbit could not reach the server. Your data is safe—reconnect and try again.' : 'Something interrupted the request. Please try again.'} actionLabel="Retry" onAction={refresh} loading={refreshing} /> : stats.isLoading ? <SkeletonList /> : stats.data ? <>
        <View style={styles.summary}>
          <Metric label="Tasks" value={stats.data.totalTasks} detail={`${stats.data.completedTasks} done`} />
          <View style={styles.metricDivider} />
          <Metric label="Projects" value={stats.data.totalProjects} detail={`${stats.data.projectsInProgress} active`} />
          <View style={styles.metricDivider} />
          <Metric label="Complete" value={`${Math.round(stats.data.taskCompletionRate)}%`} detail={`${stats.data.pendingTasks} pending`} />
        </View>
        <View style={styles.sectionHeader}><View><Text style={uiStyles.sectionTitle}>Focus</Text><Text style={styles.sectionMeta}>Your latest work across projects</Text></View><Button label="View all" full={false} tone="ghost" onPress={() => router.push('/tasks')} /></View>
        <View style={styles.list}>{tasks.data?.items.length ? tasks.data.items.map((task) => <TaskCard key={task.id} task={task} projectName={projectNames.get(task.projectId)} onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })} />) : <StatePanel icon="checkmark-done-outline" title="No tasks yet" message="Break your next project into a clear first step." actionLabel="Create task" onAction={() => router.push('/tasks/new')} />}</View>
        <View style={styles.sectionHeader}><View><Text style={uiStyles.sectionTitle}>Projects</Text><Text style={styles.sectionMeta}>Recent workspaces</Text></View><Button label="View all" full={false} tone="ghost" onPress={() => router.push('/projects')} /></View>
        <View style={styles.list}>{projects.data?.items.length ? projects.data.items.map((project) => <ProjectCard key={project.id} project={project} onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })} />) : <StatePanel icon="folder-open-outline" title="No projects yet" message="Create your first project and turn an idea into a plan." actionLabel="Create project" onAction={() => router.push('/projects/new')} />}</View>
      </> : null}
    </Screen>
  );
}

function Metric({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricDetail}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  summary: { minHeight: 94, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  metric: { flex: 1, paddingHorizontal: spacing.sm }, metricDivider: { width: 1, height: 50, backgroundColor: colors.border }, metricValue: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.5 }, metricLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }, metricDetail: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xxl, marginBottom: spacing.sm }, sectionMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 }, list: { gap: spacing.sm },
});
