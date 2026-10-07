import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// 1. Ensure environment variables from .env are available to the test process
loadEnvFile(path.resolve(__dirname, '../.env'));
loadEnvFile(path.resolve(__dirname, '../../../.env'));

process.env.NODE_ENV = 'test';

function extractDbName(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '').split('?')[0].toLowerCase();
  } catch {
    return '';
  }
}

// 2. Strict validation of test database isolation (Repair 1 ? F9)
const testDbUrl = process.env.TEST_DATABASE_URL;
const devDbUrl = process.env.DATABASE_URL;

if (!testDbUrl || testDbUrl.trim().length === 0) {
  throw new Error(
    'FATAL: TEST_DATABASE_URL must be configured when running integration tests. Tests fail closed to protect application databases.'
  );
}

const testDbName = extractDbName(testDbUrl);
const devDbName = extractDbName(devDbUrl);

if (
  testDbUrl === devDbUrl ||
  (testDbName && devDbName && testDbName === devDbName) ||
  testDbName === 'orbit_dev' ||
  testDbName === 'orbit_prod'
) {
  throw new Error(
    `FATAL: TEST_DATABASE_URL cannot point to the application or development database ('${testDbName}'). Integration tests require a dedicated test database (e.g. orbit_test).`
  );
}

// 3. Point default DATABASE_URL to TEST_DATABASE_URL for all test runtime connections
process.env.DATABASE_URL = testDbUrl;
