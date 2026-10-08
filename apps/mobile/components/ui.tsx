import React, { useState } from 'react';
import DateTimePicker, { type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, type TextInputProps, View, type ViewStyle, type RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, formatDate, radius, spacing } from '../lib/theme';
import { toDateOnly } from '../lib/validation';
import type { ProjectStatus, TaskPriority, TaskStatus } from '../lib/types';

export function Screen({ children, scroll = false, refreshControl, contentStyle }: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: ViewStyle;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >{children}</ScrollView>
  ) : <View style={[styles.screenContent, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function OrbitMark({ size = 38 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]} accessibilityLabel="Orbit">
      <View style={[styles.markCore, { width: size * 0.28, height: size * 0.28, borderRadius: size }]} />
      <View style={[styles.markDot, { width: size * 0.16, height: size * 0.16, borderRadius: size, right: size * 0.03, top: size * 0.12 }]} />
    </View>
  );
}

export function Heading({ eyebrow, title, subtitle, right }: {
  eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.heading}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({ label, onPress, icon, tone = 'primary', loading, disabled, full = true }: {
  label: string; onPress(): void; icon?: keyof typeof Ionicons.glyphMap; tone?: ButtonTone;
  loading?: boolean; disabled?: boolean; full?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[`button_${tone}`], full && styles.full, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator color={tone === 'primary' ? colors.white : colors.text} /> : (
        <>{icon ? <Ionicons name={icon} color={tone === 'primary' ? colors.white : tone === 'danger' ? colors.danger : colors.text} size={18} /> : null}<Text style={[styles.buttonLabel, tone === 'danger' && styles.dangerText]}>{label}</Text></>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Ionicons name={icon} color={colors.textSecondary} size={21} />
    </Pressable>
  );
}

export function Field({ label, error, hint, multiline, ...props }: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        multiline={multiline}
        style={[styles.field, multiline && styles.multiline, error && styles.fieldError]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PasswordField(props: Omit<React.ComponentProps<typeof Field>, 'secureTextEntry'>) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <Field {...props} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} />
      <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible((value) => !value)} style={styles.passwordToggle}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} color={colors.textSecondary} size={21} />
      </Pressable>
    </View>
  );
}

export function SearchField({ value, onChangeText, placeholder = 'Search' }: { value: string; onChangeText(value: string): void; placeholder?: string }) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search-outline" size={19} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        style={styles.searchInput}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value ? <Pressable accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={10}><Ionicons name="close-circle" size={19} color={colors.textMuted} /></Pressable> : null}
    </View>
  );
}

export function ChoiceChips<T extends string>({ value, onChange, options, label }: {
  value?: T; onChange(value: T | undefined): void; options: { value: T; label: string }[]; label?: string;
}) {
  return (
    <View style={styles.chipsSection}>
      {label ? <Text style={styles.filterLabel}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {options.map((option) => {
          const active = option.value === value;
          return <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChange(active ? undefined : option.value)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text></Pressable>;
        })}
      </ScrollView>
    </View>
  );
}

export function DateField({ label, value, onChange, error }: { label: string; value: string | null; onChange(value: string | null): void; error?: string | null }) {
  const [show, setShow] = useState(false);
  const onDate = (_event: DateTimePickerChangeEvent, date: Date) => {
    if (Platform.OS === 'android') setShow(false);
    onChange(toDateOnly(date));
  };
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ? formatDate(value) : 'not set'}`} onPress={() => setShow(true)} style={[styles.dateField, error && styles.fieldError]}>
        <Ionicons name="calendar-outline" color={colors.textSecondary} size={20} />
        <Text style={[styles.dateText, !value && styles.placeholder]}>{value ? formatDate(value) : 'Select date'}</Text>
        {value ? <Pressable accessibilityLabel={`Clear ${label}`} hitSlop={10} onPress={() => onChange(null)}><Ionicons name="close-circle" color={colors.textMuted} size={20} /></Pressable> : null}
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {show ? <DateTimePicker value={value ? new Date(`${value}T00:00:00`) : new Date()} mode="date" display="default" onValueChange={onDate} onDismiss={() => setShow(false)} /> : null}
    </View>
  );
}

export function StatusBadge({ value }: { value: ProjectStatus | TaskStatus | TaskPriority }) {
  const complete = value === 'COMPLETED';
  const hot = value === 'HIGH';
  const active = value === 'IN_PROGRESS';
  const label = value.toLowerCase().replaceAll('_', ' ').replace(/^./, (char) => char.toUpperCase());
  return <View style={[styles.badge, complete && styles.badgeSuccess, hot && styles.badgeDanger, active && styles.badgeAccent]}><View style={[styles.badgeDot, complete && styles.dotSuccess, hot && styles.dotDanger, active && styles.dotAccent]} /><Text style={styles.badgeText}>{label}</Text></View>;
}

export function StatePanel({ icon = 'cloud-offline-outline', title, message, actionLabel, onAction, loading }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; message: string; actionLabel?: string; onAction?(): void; loading?: boolean;
}) {
  return (
    <View style={styles.statePanel}>
      <View style={styles.stateIcon}><Ionicons name={icon} size={25} color={colors.textSecondary} /></View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} icon="refresh-outline" onPress={onAction} loading={loading} full={false} tone="secondary" /> : null}
    </View>
  );
}

export function SkeletonList() {
  return <View style={styles.skeletonStack}>{[0, 1, 2].map((item) => <View key={item} style={styles.skeletonCard}><View style={styles.skeletonWide} /><View style={styles.skeletonNarrow} /><View style={styles.skeletonRow}><View style={styles.skeletonPill} /><View style={styles.skeletonPill} /></View></View>)}</View>;
}

export function Divider() { return <View style={styles.divider} />; }

export const uiStyles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  caption: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: colors.canvas },
  screenContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.canvas },
  mark: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: '#3641A1', alignItems: 'center', justifyContent: 'center' },
  markCore: { backgroundColor: colors.accent }, markDot: { position: 'absolute', backgroundColor: colors.white },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.xl },
  headingCopy: { flex: 1 }, eyebrow: { color: colors.accent, fontSize: 11, lineHeight: 16, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  heading: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7 }, subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 5 },
  button: { minHeight: 48, paddingHorizontal: 18, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  full: { width: '100%' }, button_primary: { backgroundColor: colors.accent, borderColor: colors.accent }, button_secondary: { backgroundColor: colors.raised, borderColor: colors.borderStrong },
  button_ghost: { backgroundColor: 'transparent', borderColor: 'transparent' }, button_danger: { backgroundColor: colors.dangerSoft, borderColor: '#6B272A' },
  buttonLabel: { color: colors.text, fontSize: 15, fontWeight: '700' }, dangerText: { color: '#FF8589' }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.45 },
  iconButton: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  fieldWrap: { gap: 7 }, label: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  field: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.raised, paddingHorizontal: 14, color: colors.text, fontSize: 16 },
  multiline: { minHeight: 112, paddingTop: 13, textAlignVertical: 'top' }, fieldError: { borderColor: colors.danger }, errorText: { color: '#FF8589', fontSize: 12, lineHeight: 17 }, hint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  passwordToggle: { position: 'absolute', right: 1, top: 26, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14 },
  searchInput: { flex: 1, height: '100%', color: colors.text, fontSize: 16 }, chipsSection: { gap: 7 }, filterLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  chips: { gap: spacing.sm }, chip: { minHeight: 38, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, justifyContent: 'center' },
  chipActive: { borderColor: '#4350BD', backgroundColor: colors.accentSoft }, chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' }, chipTextActive: { color: '#B7BEFF' },
  dateField: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.raised, paddingHorizontal: 14 }, dateText: { flex: 1, color: colors.text, fontSize: 16 }, placeholder: { color: colors.textMuted },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, borderRadius: radius.pill, paddingHorizontal: 9, height: 27, backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border },
  badgeSuccess: { backgroundColor: colors.successSoft, borderColor: '#185E49' }, badgeDanger: { backgroundColor: colors.dangerSoft, borderColor: '#6B272A' }, badgeAccent: { backgroundColor: colors.accentSoft, borderColor: '#4350BD' },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted }, dotSuccess: { backgroundColor: colors.success }, dotDanger: { backgroundColor: colors.danger }, dotAccent: { backgroundColor: colors.accent }, badgeText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  statePanel: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl }, stateIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.raised, marginBottom: 3 },
  stateTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: '700', textAlign: 'center' }, stateMessage: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: spacing.sm, maxWidth: 290 },
  skeletonStack: { gap: spacing.md }, skeletonCard: { height: 140, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  skeletonWide: { height: 17, width: '72%', borderRadius: 5, backgroundColor: colors.elevated }, skeletonNarrow: { height: 12, width: '48%', borderRadius: 5, backgroundColor: colors.elevated }, skeletonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 'auto' }, skeletonPill: { height: 26, width: 84, borderRadius: radius.pill, backgroundColor: colors.elevated },
  divider: { height: 1, backgroundColor: colors.border },
});
