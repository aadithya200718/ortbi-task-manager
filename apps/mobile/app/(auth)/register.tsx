import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../lib/api/client';
import { colors, spacing } from '../../lib/theme';
import { utf8ByteLength, validateEmail, validatePassword } from '../../lib/validation';
import { useAuth } from '../../providers/auth-provider';
import { Button, Field, OrbitMark, PasswordField, Screen } from '../../components/ui';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false); const [loading, setLoading] = useState(false); const [apiError, setApiError] = useState<string | null>(null);
  const nameError = attempted ? (!fullName.trim() ? 'Full name is required.' : fullName.trim().length > 100 ? 'Full name cannot exceed 100 characters.' : null) : null;
  const submit = async () => {
    setAttempted(true); setApiError(null);
    if (!fullName.trim() || fullName.trim().length > 100 || validateEmail(email) || validatePassword(password)) return;
    setLoading(true);
    try { await register({ fullName: fullName.trim(), email: email.trim().toLowerCase(), password }); router.replace('/dashboard'); }
    catch (error) { setApiError(error instanceof ApiError ? error.message : 'Unable to create your account.'); }
    finally { setLoading(false); }
  };
  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.hero}><OrbitMark size={48} /><Text style={styles.title}>Create your account</Text><Text style={styles.subtitle}>A calm place for projects, priorities, and progress.</Text></View>
      {apiError ? <View style={styles.banner}><Text style={styles.bannerText}>{apiError}</Text></View> : null}
      <View style={styles.form}>
        <Field label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" placeholder="Your name" maxLength={100} error={nameError} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" error={attempted ? validateEmail(email) : null} />
        <PasswordField label="Password" value={password} onChangeText={setPassword} autoComplete="new-password" placeholder="At least 8 characters" error={attempted ? validatePassword(password) : null} hint={`${utf8ByteLength(password)}/72 UTF-8 bytes`} />
        <Button label="Create account" icon="arrow-forward" onPress={submit} loading={loading} />
      </View>
      <View style={styles.switchRow}><Text style={styles.switchCopy}>Already have an account?</Text><Link href="/login" asChild><Pressable accessibilityRole="link"><Text style={styles.link}>Sign in</Text></Pressable></Link></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', paddingTop: 44 }, hero: { alignItems: 'center', marginBottom: spacing.xl }, title: { color: colors.text, fontSize: 29, lineHeight: 37, fontWeight: '800', letterSpacing: -0.7, marginTop: 24 }, subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 5, textAlign: 'center' },
  form: { gap: spacing.lg }, banner: { borderWidth: 1, borderColor: '#6B272A', backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 13, marginBottom: spacing.lg }, bannerText: { color: '#FFAAAD', fontSize: 13, lineHeight: 19 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xl }, switchCopy: { color: colors.textSecondary, fontSize: 14 }, link: { color: '#9DA7FF', fontSize: 14, fontWeight: '800' },
});
