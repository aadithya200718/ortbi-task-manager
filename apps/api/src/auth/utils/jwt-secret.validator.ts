const UNSAFE_SECRETS = new Set([
  'secret',
  'password',
  'changeme',
  'development-secret',
  'your_jwt_secret_here',
  'jwt_secret',
  'default_secret',
  '12345678',
  'admin',
]);

export function validateJwtSecret(secret: string | undefined | null): string {
  if (!secret || typeof secret !== 'string') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing or empty.');
  }

  const trimmed = secret.trim();
  if (trimmed.length === 0) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing or empty.');
  }

  if (UNSAFE_SECRETS.has(trimmed.toLowerCase())) {
    throw new Error(
      'FATAL: JWT_SECRET cannot be a known insecure placeholder or default.',
    );
  }

  if (trimmed.length < 16) {
    throw new Error(
      'FATAL: JWT_SECRET is too short (minimum 16 characters required).',
    );
  }

  return trimmed;
}
