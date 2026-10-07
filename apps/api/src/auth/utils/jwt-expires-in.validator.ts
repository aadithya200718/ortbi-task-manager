/**
 * Validates JWT_EXPIRES_IN environment variable.
 * Must be a non-empty duration string with explicit unit like "60s", "15m", "1h", "7d", "30d", "3600s".
 * Unitless duration strings (e.g. "3600", "10") are strictly rejected.
 * Minimum allowed: 60 seconds (60s / 1m).
 * Maximum allowed: 30 days (30d / 720h / 2592000s).
 */
export function validateJwtExpiresIn(expiresIn: string | undefined | null): string {
  if (!expiresIn || typeof expiresIn !== 'string') {
    throw new Error('FATAL: JWT_EXPIRES_IN environment variable is missing or empty.');
  }

  const trimmed = expiresIn.trim();
  if (trimmed.length === 0) {
    throw new Error('FATAL: JWT_EXPIRES_IN environment variable is missing or empty.');
  }

  // Reject unitless numeric strings explicitly (e.g., "3600", "10", "0")
  if (/^\d+$/.test(trimmed)) {
    throw new Error(
      `FATAL: JWT_EXPIRES_IN '${trimmed}' is invalid. Unitless duration strings are not permitted. Expected format with explicit unit like "60s", "15m", "1h", "7d", "30d", or "3600s".`,
    );
  }

  // Require duration string with explicit unit: e.g. 60s, 15m, 1h, 7d, 30d, 3600s
  const match = trimmed.match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!match) {
    throw new Error(
      `FATAL: JWT_EXPIRES_IN '${trimmed}' is invalid. Expected format with explicit unit like "60s", "15m", "1h", "7d", "30d", or "3600s".`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (value <= 0) {
    throw new Error('FATAL: JWT_EXPIRES_IN must be greater than zero.');
  }

  let totalSeconds = 0;
  switch (unit) {
    case 's':
      totalSeconds = value;
      break;
    case 'm':
      totalSeconds = value * 60;
      break;
    case 'h':
      totalSeconds = value * 3600;
      break;
    case 'd':
      totalSeconds = value * 86400;
      break;
    case 'w':
      totalSeconds = value * 604800;
      break;
  }

  if (totalSeconds < 60) {
    throw new Error('FATAL: JWT_EXPIRES_IN must be at least 60 seconds (60s or 1m).');
  }

  if (totalSeconds > 30 * 24 * 3600) {
    throw new Error('FATAL: JWT_EXPIRES_IN exceeds maximum policy of 30 days (30d).');
  }

  return trimmed;
}
