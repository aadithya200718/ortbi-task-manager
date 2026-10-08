import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, initials, radius, spacing } from '../lib/theme';
import { useAuth } from '../providers/auth-provider';
import { OrbitMark } from './ui';

export function AppHeader() {
  const { user } = useAuth();
  return (
    <View style={styles.header}>
      <View style={styles.brand}><OrbitMark size={32} /><Text style={styles.wordmark}>ORBIT</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open account" onPress={() => router.push('/account')} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
        <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, wordmark: { color: colors.text, fontSize: 14, fontWeight: '900', letterSpacing: 2.2 },
  avatar: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: '#4350BD' },
  avatarText: { color: '#C8CDFF', fontSize: 13, fontWeight: '800' }, pressed: { opacity: 0.7 },
});
