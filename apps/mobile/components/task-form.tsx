import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ChoiceChips, DateField, Field } from './ui';
import { colors, spacing } from '../lib/theme';
import { normalizeDateOnly, validateName } from '../lib/validation';
import type { CreateTaskInput, Project, Task, TaskPriority, TaskStatus, UpdateTaskInput } from '../lib/types';

export function TaskForm({ task, projects, initialProjectId, submitLabel, loading, apiError, onSubmit }: {
  task?: Task; projects: Project[]; initialProjectId?: string; submitLabel: string; loading?: boolean; apiError?: string | null;
  onSubmit(input: CreateTaskInput | UpdateTaskInput): void;
}) {
  const [projectId, setProjectId] = useState(task?.projectId || initialProjectId || projects[0]?.id || '');
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'PENDING');
  const [dueDate, setDueDate] = useState(normalizeDateOnly(task?.dueDate));
  const [attempted, setAttempted] = useState(false);
  const nameError = attempted ? validateName(name, 'Task name') : null;
  const projectError = attempted && !task && !projectId ? 'Choose a project.' : null;
  const descriptionError = attempted && description.length > 5000 ? 'Description cannot exceed 5000 characters.' : null;

  const submit = () => {
    setAttempted(true);
    if (validateName(name, 'Task name') || (!task && !projectId) || description.length > 5000) return;
    const shared: UpdateTaskInput = { name: name.trim(), description: description.trim() || null, priority, status, dueDate };
    onSubmit(task ? shared : { ...shared, projectId });
  };

  return (
    <View style={styles.form}>
      {apiError ? <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{apiError}</Text></View> : null}
      {!task ? <View style={styles.projectPicker}><Text style={styles.label}>Project</Text>{projects.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectChips}>{projects.map((project) => <Button key={project.id} label={project.name} full={false} tone={project.id === projectId ? 'primary' : 'secondary'} onPress={() => setProjectId(project.id)} />)}</ScrollView> : <Text style={styles.emptyProjects}>Create a project before adding a task.</Text>}{projectError ? <Text style={styles.errorText}>{projectError}</Text> : null}</View> : null}
      <Field label="Task name" value={name} onChangeText={setName} placeholder="e.g. Review release checklist" autoCapitalize="sentences" maxLength={255} error={nameError} />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Add useful context" multiline maxLength={5000} error={descriptionError} hint={`${description.length}/5000`} />
      <ChoiceChips label="Priority" value={priority} onChange={(value) => value && setPriority(value)} options={[
        { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' },
      ]} />
      <ChoiceChips label="Status" value={status} onChange={(value) => value && setStatus(value)} options={[
        { value: 'PENDING', label: 'Pending' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'COMPLETED', label: 'Completed' },
      ]} />
      <DateField label="Due date" value={dueDate} onChange={setDueDate} />
      <Button label={submitLabel} icon="arrow-forward" onPress={submit} loading={loading} disabled={!task && !projects.length} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl }, projectPicker: { gap: 7 }, label: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '700' }, projectChips: { gap: spacing.sm },
  emptyProjects: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, paddingVertical: spacing.sm }, errorText: { color: '#FF8589', fontSize: 12 },
  errorBanner: { borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#6B272A', backgroundColor: colors.dangerSoft }, errorBannerText: { color: '#FFAAAD', fontSize: 13, lineHeight: 19 },
});
