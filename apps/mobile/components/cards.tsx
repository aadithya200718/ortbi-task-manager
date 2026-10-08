import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, formatDate, radius, spacing } from '../lib/theme';
import type { Project, Task } from '../lib/types';
import { StatusBadge } from './ui';

export function ProjectCard({ project, onPress }: { project: Project; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open project ${project.name}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}><View style={styles.copy}><Text style={styles.title} numberOfLines={1}>{project.name}</Text><Text style={styles.description} numberOfLines={2}>{project.description || 'No description added.'}</Text></View><Ionicons name="chevron-forward" color={colors.textMuted} size={20} /></View>
      <View style={styles.bottom}><StatusBadge value={project.status} /><View style={styles.meta}><Ionicons name="calendar-outline" size={14} color={colors.textMuted} /><Text style={styles.metaText}>{project.endDate ? formatDate(project.endDate) : 'No deadline'}</Text></View></View>
    </Pressable>
  );
}

export function TaskCard({ task, projectName, onPress, onToggle }: { task: Task; projectName?: string; onPress(): void; onToggle?(): void }) {
  const done = task.status === 'COMPLETED';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open task ${task.name}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.taskRow}>
        {onToggle ? <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={done ? `Reopen ${task.name}` : `Complete ${task.name}`} onPress={(event) => { event.stopPropagation(); onToggle(); }} style={[styles.check, done && styles.checkDone]}>{done ? <Ionicons name="checkmark" color={colors.white} size={16} /> : null}</Pressable> : null}
        <View style={styles.copy}><Text style={[styles.title, done && styles.done]} numberOfLines={2}>{task.name}</Text>{projectName ? <Text style={styles.projectName}>{projectName}</Text> : null}</View>
        <Ionicons name="chevron-forward" color={colors.textMuted} size={20} />
      </View>
      <View style={styles.bottom}><View style={styles.badges}><StatusBadge value={task.status} /><StatusBadge value={task.priority} /></View><View style={styles.meta}><Ionicons name="time-outline" size={14} color={colors.textMuted} /><Text style={styles.metaText}>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</Text></View></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 132, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] }, top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }, copy: { flex: 1, gap: 5 },
  title: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '700' }, done: { color: colors.textMuted, textDecorationLine: 'line-through' }, description: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 }, projectName: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, badges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 5 }, metaText: { color: colors.textMuted, fontSize: 11 },
  check: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }, checkDone: { backgroundColor: colors.success, borderColor: colors.success },
});
