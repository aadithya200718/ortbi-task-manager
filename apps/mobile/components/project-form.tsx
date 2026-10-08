import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ChoiceChips, DateField, Field } from './ui';
import { colors, spacing } from '../lib/theme';
import { normalizeDateOnly, validateName } from '../lib/validation';
import type { CreateProjectInput, Project } from '../lib/types';

export function ProjectForm({ project, submitLabel, loading, apiError, onSubmit }: {
  project?: Project; submitLabel: string; loading?: boolean; apiError?: string | null;
  onSubmit(input: CreateProjectInput): void;
}) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState<CreateProjectInput['status']>(project?.status || 'NOT_STARTED');
  const [startDate, setStartDate] = useState(normalizeDateOnly(project?.startDate));
  const [endDate, setEndDate] = useState(normalizeDateOnly(project?.endDate));
  const [attempted, setAttempted] = useState(false);
  const nameError = attempted ? validateName(name, 'Project name') : null;
  const descriptionError = attempted && description.length > 5000 ? 'Description cannot exceed 5000 characters.' : null;
  const dateError = attempted && startDate && endDate && endDate < startDate ? 'End date must be on or after start date.' : null;

  const submit = () => {
    setAttempted(true);
    if (validateName(name, 'Project name') || description.length > 5000 || (startDate && endDate && endDate < startDate)) return;
    onSubmit({ name: name.trim(), description: description.trim() || null, status, startDate, endDate });
  };

  return (
    <View style={styles.form}>
      {apiError ? <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{apiError}</Text></View> : null}
      <Field label="Project name" value={name} onChangeText={setName} placeholder="e.g. Mobile launch" autoCapitalize="sentences" maxLength={255} error={nameError} />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="What are you planning?" multiline maxLength={5000} error={descriptionError} hint={`${description.length}/5000`} />
      <ChoiceChips label="Status" value={status} onChange={(value) => value && setStatus(value)} options={[
        { value: 'NOT_STARTED', label: 'Not started' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'COMPLETED', label: 'Completed' },
      ]} />
      <View style={styles.dateRow}><View style={styles.date}><DateField label="Start date" value={startDate} onChange={setStartDate} /></View><View style={styles.date}><DateField label="End date" value={endDate} onChange={setEndDate} error={dateError} /></View></View>
      <Button label={submitLabel} icon="arrow-forward" onPress={submit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl }, dateRow: { gap: spacing.lg }, date: { flex: 1 },
  errorBanner: { borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#6B272A', backgroundColor: colors.dangerSoft }, errorBannerText: { color: '#FFAAAD', fontSize: 13, lineHeight: 19 },
});
