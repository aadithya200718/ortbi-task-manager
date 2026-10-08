import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../lib/theme';
import { IconButton } from './ui';

export function SubpageHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return <View style={styles.header}><IconButton icon="arrow-back" label="Go back" onPress={() => router.back()} /><Text style={styles.title} numberOfLines={1}>{title}</Text><View style={styles.right}>{right || <View style={styles.spacer} />}</View></View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg },
  title: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800' }, right: { minWidth: 48, alignItems: 'flex-end' }, spacer: { width: 48 },
});
