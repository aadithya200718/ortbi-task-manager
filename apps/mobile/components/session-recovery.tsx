import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatePanel } from './ui';
import { colors, spacing } from '../lib/theme';

export function SessionRecovery({ message, loading, onRetry }: { message: string; loading: boolean; onRetry(): void }) {
  return (
    <View style={styles.root}>
      <StatePanel title="You’re offline" message={message} actionLabel="Retry" onAction={onRetry} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.canvas } });
