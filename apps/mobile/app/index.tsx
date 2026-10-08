import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../lib/theme';
import { useAuth } from '../providers/auth-provider';
import { SessionRecovery } from '../components/session-recovery';

export default function Index() {
  const { isLoading, isAuthenticated, restoreError, retryRestore } = useAuth();
  if (isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.accent} /></View>;
  if (restoreError) return <SessionRecovery message={restoreError} loading={isLoading} onRetry={() => void retryRestore()} />;
  return <Redirect href={isAuthenticated ? '/dashboard' : '/login'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas } });
