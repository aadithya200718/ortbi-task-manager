import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SubpageHeader } from '../../components/subpage-header';
import { Button, OrbitMark, Screen, uiStyles } from '../../components/ui';
import { colors, formatDate, initials, radius, spacing } from '../../lib/theme';
import { useAuth } from '../../providers/auth-provider';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const confirmLogout = () => Alert.alert('Sign out of Orbit?', 'You’ll need your email and password to sign in again.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void logout() }]);
  return <View style={styles.root}><SubpageHeader title="Account" /><Screen scroll><View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(user?.fullName)}</Text></View><Text style={styles.name}>{user?.fullName}</Text><Text style={styles.email}>{user?.email}</Text></View><View style={uiStyles.card}><Row label="Member since" value={formatDate(user?.createdAt)} /><View style={styles.divider} /><Row label="Session storage" value="Secure device storage" /></View><View style={styles.brand}><OrbitMark size={30} /><Text style={styles.brandText}>Orbit for Android · Version 1.0.0</Text></View><Button label="Sign out" icon="log-out-outline" tone="danger" onPress={confirmLogout} /></Screen></View>;
}

function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas }, profile: { alignItems: 'center', paddingVertical: spacing.xxl }, avatar: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: '#4350BD', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#C8CDFF', fontSize: 22, fontWeight: '800' }, name: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: spacing.lg }, email: { color: colors.textSecondary, fontSize: 14, marginTop: 3 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: spacing.sm }, rowLabel: { color: colors.textMuted, fontSize: 13 }, rowValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', textAlign: 'right' }, divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }, brand: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xxl }, brandText: { color: colors.textMuted, fontSize: 11 } });
