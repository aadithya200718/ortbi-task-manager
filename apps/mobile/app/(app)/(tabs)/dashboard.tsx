import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, Heading, Screen, SkeletonList, StatePanel, uiStyles } from '../../../components/ui';
import { ProjectCard, TaskCard } from '../../../components/cards';
import { dashboardApi } from '../../../lib/api/dashboard';
import { projectsApi } from '../../../lib/api/projects';
import { tasksApi } from '../../../lib/api/tasks';
import { ApiError } from '../../../lib/api/client';
import { colors, radius, spacing } from '../../../lib/theme';
import { useAuth } from '../../../providers/auth-provider';

export default function DashboardScreen() {
  const { user } = useAuth();
  const stats = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  const projects = useQuery({ queryKey: ['projects', 'dashboard'], queryFn: () => projectsApi.list({ limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }) });
  const tasks = useQuery({ queryKey: ['tasks', 'dashboard'], queryFn: () => tasksApi.list({ limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }) });
  const refreshing = stats.isRefetching || projects.isRefetching || tasks.isRefetching;
  const refresh = () => { void Promise.all([stats.refetch(), projects.refetch(), tasks.refetch()]); };
  const error = stats.error || projects.error || tasks.error;
  const network = error instanceof ApiError && error.isNetworkError;
  const projectNames = new Map((projects.data?.items || []).map((project) => [project.id, project.name]));

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} />}>
      <Heading eyebrow="Overview" title={`Good day, ${user?.fullName.split(' ')[0] || 'there'}`} subtitle="A focused view of everything moving forward." />
      {error ? <StatePanel title={network ? 'You’re offline' : 'Couldn’t load your workspace'} message={network ? 'Orbit could not reach the server. Your data is safe—reconnect and try again.' : 'Something interrupted the request. Please try again.'} actionLabel="Retry" onAction={refresh} loading={refreshing} /> : stats.isLoading ? <SkeletonList /> : stats.data ? <>
        <View style={styles.heroCard}>
          <View><Text style={styles.heroLabel}>Task completion</Text><Text style={styles.heroValue}>{Math.round(stats.data.taskCompletionRate)}%</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progress, { width: `${Math.min(100, stats.data.taskCompletionRate)}%` }]} /></View>
          <Text style={styles.heroMeta}>{stats.data.completedTasks} of {stats.data.totalTasks} tasks completed</Text>
        </View>
        <View style={styles.statGrid}>
          <Stat icon="folder-open-outline" label="Projects" value={stats.data.totalProjects} detail={`${stats.data.projectsInProgress} active`} />
          <Stat icon="checkmark-circle-outline" label="Tasks" value={stats.data.totalTasks} detail={`${stats.data.pendingTasks} pending`} />
          <Stat icon="rocket-outline" label="In progress" value={stats.data.inProgressTasks} detail="tasks moving" />
          <Stat icon="sparkles-outline" label="Completed" value={stats.data.completedTasks} detail="all time" />
        </View>
        <View style={styles.sectionHeader}><Text style={uiStyles.sectionTitle}>Recent projects</Text><Button label="View all" full={false} tone="ghost" onPress={() => router.push('/projects')} /></View>
        <View style={styles.list}>{projects.data?.items.length ? projects.data.items.map((project) => <ProjectCard key={project.id} project={project} onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })} />) : <StatePanel icon="folder-open-outline" title="No projects yet" message="Create your first project and turn an idea into a plan." actionLabel="Create project" onAction={() => router.push('/projects/new')} />}</View>
        <View style={styles.sectionHeader}><Text style={uiStyles.sectionTitle}>Recent tasks</Text><Button label="View all" full={false} tone="ghost" onPress={() => router.push('/tasks')} /></View>
        <View style={styles.list}>{tasks.data?.items.length ? tasks.data.items.map((task) => <TaskCard key={task.id} task={task} projectName={projectNames.get(task.projectId)} onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })} />) : <StatePanel icon="checkmark-done-outline" title="No tasks yet" message="Break your next project into a clear first step." actionLabel="Create task" onAction={() => router.push('/tasks/new')} />}</View>
      </> : null}
    </Screen>
  );
}

function Stat({ icon, label, value, detail }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; detail: string }) {
  return <View style={styles.stat}><View style={styles.statIcon}><Ionicons name={icon} size={18} color="#9DA7FF" /></View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.statDetail}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  heroCard: { ...uiStyles.card, backgroundColor: colors.accentSoft, borderColor: '#37419B', gap: spacing.md }, heroLabel: { color: '#BBC2FF', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }, heroValue: { color: colors.white, fontSize: 42, fontWeight: '800', letterSpacing: -1.5, marginTop: 2 },
  progressTrack: { height: 7, borderRadius: 8, overflow: 'hidden', backgroundColor: '#262C5C' }, progress: { height: '100%', borderRadius: 8, backgroundColor: '#8995FF' }, heroMeta: { color: '#9DA7E4', fontSize: 12 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md }, stat: { width: '47.9%', minHeight: 142, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg }, statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }, statLabel: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md }, statValue: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 2 }, statDetail: { color: colors.textSecondary, fontSize: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xxl, marginBottom: spacing.md }, list: { gap: spacing.md },
});
