export const colors = {
  canvas: '#0A0A0B',
  surface: '#111113',
  raised: '#171719',
  elevated: '#1E1E22',
  border: '#27272B',
  borderStrong: '#34343A',
  text: '#F5F5F4',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  accent: '#5B6CFF',
  accentPressed: '#4E5EEB',
  accentSoft: '#1C2145',
  success: '#10B981',
  successSoft: '#102C24',
  warning: '#F59E0B',
  warningSoft: '#332510',
  danger: '#EF4444',
  dangerSoft: '#351718',
  info: '#60A5FA',
  white: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const statusLabels = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
} as const;

export function formatDate(value?: string | null): string {
  if (!value) return 'No date';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function initials(name?: string): string {
  return (name || 'User').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
