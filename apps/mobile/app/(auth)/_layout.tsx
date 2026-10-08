import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../../lib/theme';
import { useAuth } from '../../providers/auth-provider';
import { SessionRecovery } from '../../components/session-recovery';

export default function AuthLayout() {
  const { isLoading, isAuthenticated, restoreError, retryRestore } = useAuth();
  if (isLoading) return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /></View>;
  if (restoreError) return <SessionRecovery message={restoreError} loading={isLoading} onRetry={() => void retryRestore()} />;
  if (isAuthenticated) return <Redirect href="/dashboard" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.canvas } }} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas } });
