import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../lib/api/client';
import { colors, spacing } from '../../lib/theme';
import { validateEmail, validatePassword } from '../../lib/validation';
import { useAuth } from '../../providers/auth-provider';
import { Button, Field, OrbitMark, PasswordField, Screen } from '../../components/ui';

export default function LoginScreen() {
  const { login, sessionMessage, clearSessionMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const submit = async () => {
    setAttempted(true); setApiError(null); clearSessionMessage();
    if (validateEmail(email) || validatePassword(password, false)) return;
    setLoading(true);
    try { await login({ email: email.trim().toLowerCase(), password }); router.replace('/dashboard'); }
    catch (error) { setApiError(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.'); }
    finally { setLoading(false); }
  };
  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.hero}><OrbitMark size={54} /><Text style={styles.wordmark}>ORBIT</Text><Text style={styles.title}>Welcome back</Text><Text style={styles.subtitle}>Sign in to pick up where you left off.</Text></View>
      {(sessionMessage || apiError) ? <View style={styles.banner}><Text style={styles.bannerText}>{sessionMessage || apiError}</Text></View> : null}
      <View style={styles.form}>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" error={attempted ? validateEmail(email) : null} />
        <PasswordField label="Password" value={password} onChangeText={setPassword} autoComplete="current-password" placeholder="Your password" error={attempted ? validatePassword(password, false) : null} />
        <Button label="Sign in" icon="arrow-forward" onPress={submit} loading={loading} />
      </View>
      <View style={styles.switchRow}><Text style={styles.switchCopy}>New to Orbit?</Text><Link href="/register" asChild><Pressable accessibilityRole="link"><Text style={styles.link}>Create an account</Text></Pressable></Link></View>
      <Text style={styles.security}>Your session is encrypted and stored securely on this device.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', paddingTop: 60 }, hero: { alignItems: 'center', marginBottom: spacing.xl }, wordmark: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  title: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, marginTop: 30 }, subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 5, textAlign: 'center' },
  form: { gap: spacing.lg }, banner: { borderWidth: 1, borderColor: '#6B4D20', backgroundColor: colors.warningSoft, borderRadius: 12, padding: 13, marginBottom: spacing.lg }, bannerText: { color: '#F9CC7A', fontSize: 13, lineHeight: 19 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xl }, switchCopy: { color: colors.textSecondary, fontSize: 14 }, link: { color: '#9DA7FF', fontSize: 14, fontWeight: '800' }, security: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: spacing.xxl },
});
