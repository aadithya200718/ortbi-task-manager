import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heading, Screen } from '../../../components/ui';
import { colors, radius, spacing } from '../../../lib/theme';

export default function CreateScreen() {
  return (
    <Screen scroll>
      <Heading eyebrow="Quick start" title="Create" subtitle="Add structure without breaking your flow." />
      <View style={styles.stack}>
        <CreateCard icon="folder-open-outline" title="New project" copy="Shape an initiative with a status, description, and timeline." onPress={() => router.push('/projects/new')} />
        <CreateCard icon="checkmark-circle-outline" title="New task" copy="Capture a focused action under one of your existing projects." onPress={() => router.push('/tasks/new')} />
      </View>
      <View style={styles.note}><Ionicons name="information-circle-outline" color={colors.textMuted} size={18} /><Text style={styles.noteText}>Projects hold the context. Tasks turn that context into clear, trackable progress.</Text></View>
    </Screen>
  );
}

function CreateCard({ icon, title, copy, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; copy: string; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.icon}><Ionicons name={icon} size={26} color="#AAB2FF" /></View><View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.description}>{copy}</Text></View><Ionicons name="arrow-forward" size={21} color={colors.textMuted} /></Pressable>;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md }, card: { minHeight: 142, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg }, pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  icon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: '#37419B', alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 5 }, title: { color: colors.text, fontSize: 18, fontWeight: '800' }, description: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  note: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', padding: spacing.lg, marginTop: spacing.xl }, noteText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
