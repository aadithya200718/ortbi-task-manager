import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, executeRequest, normalizeApiError } from '../lib/api/core';
import { restoreSession, type TokenStorage } from '../lib/session-core';
import { sanitizeTaskUpdate } from '../lib/task-payload';
import { normalizeDateOnly, utf8ByteLength, validatePassword } from '../lib/validation';

function memoryStorage(initial: string | null): TokenStorage & { cleared: number; value: string | null } {
  return {
    value: initial,
    cleared: 0,
    async get() { return this.value; },
    async set(token) { this.value = token; },
    async clear() { this.value = null; this.cleared += 1; },
  };
}

test('session restore skips profile request when secure storage is empty', async () => {
  const storage = memoryStorage(null); let calls = 0;
  const session = await restoreSession(storage, async () => { calls += 1; return { id: 'user' }; });
  assert.deepEqual(session, { token: null, user: null }); assert.equal(calls, 0);
});

test('session restore returns token and user from a valid secure session', async () => {
  const storage = memoryStorage('secure-token');
  const session = await restoreSession(storage, async () => ({ id: 'user-1' }));
  assert.deepEqual(session, { token: 'secure-token', user: { id: 'user-1' } }); assert.equal(storage.cleared, 0);
});

test('network failure during session restore preserves the secure token', async () => {
  const storage = memoryStorage('secure-token');
  await assert.rejects(() => restoreSession(storage, async () => { throw new TypeError('offline'); }));
  assert.equal(storage.value, 'secure-token'); assert.equal(storage.cleared, 0);
});

test('401 response runs unauthorized cleanup and preserves API details', async () => {
  const storage = memoryStorage('expired-token');
  const response = new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Token expired' }), { status: 401, headers: { 'content-type': 'application/json' } });
  await assert.rejects(
    () => executeRequest({ fetchImpl: (async () => response) as typeof fetch, url: 'https://orbit.test/api', onUnauthorized: () => storage.clear() }),
    (error: unknown) => error instanceof ApiError && error.statusCode === 401 && error.code === 'UNAUTHORIZED' && error.message === 'Token expired',
  );
  assert.equal(storage.value, null); assert.equal(storage.cleared, 1);
});

test('API errors normalize array messages and fallback codes', () => {
  const error = normalizeApiError(400, { message: ['Name is required', 'Ignored second message'] }, 'Bad Request');
  assert.equal(error.message, 'Name is required'); assert.equal(error.code, 'HTTP_400'); assert.equal(error.statusCode, 400);
});

test('network failures are distinct retryable offline errors', async () => {
  await assert.rejects(
    () => executeRequest({ fetchImpl: (async () => { throw new TypeError('offline'); }) as typeof fetch, url: 'https://orbit.test/api' }),
    (error: unknown) => error instanceof ApiError && error.statusCode === 0 && error.code === 'NETWORK_ERROR' && error.isNetworkError,
  );
});

test('task update payload strips immutable and server-managed fields', () => {
  const result = sanitizeTaskUpdate({ name: 'Ship', status: 'COMPLETED', dueDate: null, projectId: 'forbidden', userId: 'forbidden', completedAt: 'forbidden', unexpected: true });
  assert.deepEqual(result, { name: 'Ship', status: 'COMPLETED', dueDate: null });
  assert.equal('projectId' in result, false); assert.equal('userId' in result, false); assert.equal('completedAt' in result, false);
});

test('password validation enforces 72 UTF-8 bytes, not only characters', () => {
  assert.equal(utf8ByteLength('a'.repeat(72)), 72); assert.equal(validatePassword('a'.repeat(72)), null);
  assert.equal(utf8ByteLength('🙂'.repeat(19)), 76); assert.equal(validatePassword('🙂'.repeat(19)), 'Password cannot exceed 72 UTF-8 bytes.');
});

test('API date timestamps normalize to date-only update values', () => {
  assert.equal(normalizeDateOnly('2026-10-08T00:00:00.000Z'), '2026-10-08');
  assert.equal(normalizeDateOnly(null), null);
});
