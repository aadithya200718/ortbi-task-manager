export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No date';
  try {
    const [y, m, d] = dateString.split('T')[0].split('-');
    if (!y || !m || !d) return dateString;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'No date';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
