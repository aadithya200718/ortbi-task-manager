export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0) || 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
  if (value.trim().length > 255) return 'Email cannot exceed 255 characters.';
  return null;
}

export function validatePassword(value: string, requireMinimum = true): string | null {
  if (!value) return 'Password is required.';
  if (requireMinimum && value.length < 8) return 'Use at least 8 characters.';
  if (value.length > 72) return 'Password cannot exceed 72 characters.';
  if (utf8ByteLength(value) > 72) return 'Password cannot exceed 72 UTF-8 bytes.';
  return null;
}

export function validateName(value: string, label = 'Name'): string | null {
  if (!value.trim()) return `${label} is required.`;
  if (value.trim().length > 255) return `${label} cannot exceed 255 characters.`;
  return null;
}

export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateOnly(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null;
}
