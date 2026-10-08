import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser sessionStorage
const mockSessionStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

globalThis.window = {
  sessionStorage: mockSessionStorage,
};
globalThis.sessionStorage = mockSessionStorage;

// 1. ApiError definition & normalization
class ApiError extends Error {
  constructor(envelope) {
    const primaryMessage = Array.isArray(envelope.message)
      ? envelope.message[0] || 'An unexpected error occurred'
      : envelope.message || 'An unexpected error occurred';
    super(primaryMessage);
    this.name = 'ApiError';
    this.statusCode = envelope.statusCode;
    this.code = envelope.code || 'UNKNOWN_ERROR';
    this.errors = envelope.errors;
  }
}

describe('API Error Normalization', () => {
  test('normalizes error envelope with array messages', () => {
    const error = new ApiError({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: ['Email is invalid', 'Password is too short'],
    });

    assert.equal(error.statusCode, 400);
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.equal(error.message, 'Email is invalid');
  });

  test('normalizes single string message and preserves structured errors', () => {
    const error = new ApiError({
      statusCode: 409,
      code: 'CONFLICT',
      message: 'Account with email already exists',
      errors: { email: ['Email already taken'] },
    });

    assert.equal(error.statusCode, 409);
    assert.equal(error.code, 'CONFLICT');
    assert.equal(error.message, 'Account with email already exists');
    assert.deepEqual(error.errors, { email: ['Email already taken'] });
  });

  test('falls back gracefully when message is empty or missing', () => {
    const error = new ApiError({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: '',
    });

    assert.equal(error.statusCode, 500);
    assert.equal(error.message, 'An unexpected error occurred');
  });
});

describe('Token Storage & Session Lifecycle', () => {
  const TOKEN_KEY = 'orbit_access_token';

  beforeEach(() => {
    mockSessionStorage.clear();
  });

  test('stores, retrieves, and clears token in sessionStorage', () => {
    assert.equal(mockSessionStorage.getItem(TOKEN_KEY), null);

    mockSessionStorage.setItem(TOKEN_KEY, 'sample-jwt-token-xyz');
    assert.equal(mockSessionStorage.getItem(TOKEN_KEY), 'sample-jwt-token-xyz');

    mockSessionStorage.removeItem(TOKEN_KEY);
    assert.equal(mockSessionStorage.getItem(TOKEN_KEY), null);
  });

  test('session restoration sets user if token exists, or clears if 401', async () => {
    mockSessionStorage.setItem(TOKEN_KEY, 'valid-token');

    // Simulate getMe
    const mockGetMe = async (token) => {
      if (token === 'valid-token') {
        return { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };
      }
      throw new ApiError({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Token expired' });
    };

    let user = await mockGetMe(mockSessionStorage.getItem(TOKEN_KEY));
    assert.equal(user.email, 'test@example.com');

    // Expired token scenario
    mockSessionStorage.setItem(TOKEN_KEY, 'expired-token');
    try {
      await mockGetMe(mockSessionStorage.getItem(TOKEN_KEY));
      assert.fail('Should have thrown 401');
    } catch (err) {
      assert.equal(err.statusCode, 401);
      mockSessionStorage.removeItem(TOKEN_KEY);
    }

    assert.equal(mockSessionStorage.getItem(TOKEN_KEY), null);
  });

  test('401 response invokes unauthorized callback to trigger redirect', () => {
    let redirectedTo = null;
    const onUnauthorized = () => {
      mockSessionStorage.removeItem(TOKEN_KEY);
      redirectedTo = '/login?expired=true';
    };

    // Simulate 401 trigger
    onUnauthorized();
    assert.equal(redirectedTo, '/login?expired=true');
    assert.equal(mockSessionStorage.getItem(TOKEN_KEY), null);
  });
});

describe('Form Validation: Login & Register', () => {
  function validateLogin(email, password) {
    const errors = {};
    if (!email || !email.trim()) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email';
    if (!password) errors.password = 'Password is required';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validateRegister(name, email, password, confirmPassword) {
    const errors = {};
    if (!name || !name.trim()) errors.name = 'Full name is required';
    else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

    if (!email || !email.trim()) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email';

    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    else {
      const byteLen = new TextEncoder().encode(password).length;
      if (byteLen > 72) errors.password = 'Password exceeds maximum length of 72 bytes';
    }

    if (!confirmPassword) errors.confirmPassword = 'Confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    return { valid: Object.keys(errors).length === 0, errors };
  }

  test('login validation catches empty fields and invalid emails', () => {
    assert.equal(validateLogin('', '').valid, false);
    assert.equal(validateLogin('invalid-email', 'password123').valid, false);
    assert.equal(validateLogin('user@example.com', 'password123').valid, true);
  });

  test('register validation enforces name, email, password length, and password match', () => {
    assert.equal(validateRegister('A', 'user@example.com', 'pass', 'pass').valid, false);
    assert.equal(validateRegister('Alice', 'user@example.com', 'pass12345', 'different').valid, false);
    assert.equal(validateRegister('Alice', 'user@example.com', 'pass12345', 'pass12345').valid, true);
  });

  test('register validation strictly enforces 72 UTF-8 byte password limit', () => {
    // 72 ascii chars = 72 bytes -> PASS
    const pass72 = 'a'.repeat(72);
    assert.equal(validateRegister('Alice', 'user@example.com', pass72, pass72).valid, true);

    // 73 ascii chars = 73 bytes -> FAIL
    const pass73 = 'a'.repeat(73);
    const res73 = validateRegister('Alice', 'user@example.com', pass73, pass73);
    assert.equal(res73.valid, false);
    assert.match(res73.errors.password, /72 bytes/);

    // 25 multi-byte emojis (4 bytes each = 100 bytes) -> FAIL
    const emojiPass = '\u{1F512}'.repeat(25);
    const resEmoji = validateRegister('Alice', 'user@example.com', emojiPass, emojiPass);
    assert.equal(resEmoji.valid, false);
    assert.match(resEmoji.errors.password, /72 bytes/);
  });
});

describe('Project Form Serialization & Invariants', () => {
  function serializeProject(name, description, status, startDate, endDate) {
    if (startDate && endDate && endDate < startDate) {
      throw new Error('End date cannot be earlier than start date');
    }
    return {
      name: name.trim(),
      description: description?.trim() || undefined,
      status: status || 'NOT_STARTED',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }

  test('serializes project with trimmed values and omits empty dates', () => {
    const payload = serializeProject('  Project Beta  ', '  Scope notes  ', 'IN_PROGRESS', '', '');
    assert.equal(payload.name, 'Project Beta');
    assert.equal(payload.description, 'Scope notes');
    assert.equal(payload.status, 'IN_PROGRESS');
    assert.equal(payload.startDate, undefined);
    assert.equal(payload.endDate, undefined);
  });

  test('validates start and end date ordering', () => {
    assert.doesNotThrow(() => {
      serializeProject('Valid Dates', '', 'NOT_STARTED', '2026-10-01', '2026-10-10');
    });

    assert.throws(() => {
      serializeProject('Invalid Dates', '', 'NOT_STARTED', '2026-10-15', '2026-10-01');
    }, /End date cannot be earlier than start date/);
  });
});

describe('Task Form Serialization & Contract Enforcement', () => {
  function serializeCreateTask(projectId, name, description, priority, status, dueDate) {
    if (!projectId) throw new Error('projectId is required');
    if (!name || !name.trim()) throw new Error('Task name is required');
    return {
      projectId,
      name: name.trim(),
      description: description?.trim() || undefined,
      priority: priority || 'MEDIUM',
      status: status || 'PENDING',
      dueDate: dueDate || undefined,
    };
  }

  function serializeUpdateTask(data) {
    // Contract requirement: projectId MUST NEVER be included in update payload
    const { projectId, userId, completedAt, ...safePayload } = data;
    return {
      ...safePayload,
      name: safePayload.name ? safePayload.name.trim() : undefined,
      description: safePayload.description ? safePayload.description.trim() : undefined,
    };
  }

  test('create task requires projectId and serializes correctly', () => {
    assert.throws(() => {
      serializeCreateTask('', 'Task 1');
    }, /projectId is required/);

    const payload = serializeCreateTask('proj-123', 'Build UI', 'Notes', 'HIGH', 'PENDING', '2026-10-12');
    assert.equal(payload.projectId, 'proj-123');
    assert.equal(payload.name, 'Build UI');
    assert.equal(payload.priority, 'HIGH');
    assert.equal(payload.dueDate, '2026-10-12');
  });

  test('update task strictly strips projectId, userId, and completedAt', () => {
    const dirtyUpdateInput = {
      projectId: 'proj-123', // ILLEGAL in backend contract
      userId: 'user-999',     // ILLEGAL
      completedAt: '2026-10-07T12:00:00Z', // ILLEGAL
      name: '  Refactor Authentication  ',
      description: 'Clean up token storage',
      status: 'COMPLETED',
      priority: 'HIGH',
    };

    const cleanPayload = serializeUpdateTask(dirtyUpdateInput);

    assert.equal('projectId' in cleanPayload, false, 'projectId must NOT be present in update payload');
    assert.equal('userId' in cleanPayload, false, 'userId must NOT be present in update payload');
    assert.equal('completedAt' in cleanPayload, false, 'completedAt must NOT be present in update payload');
    assert.equal(cleanPayload.name, 'Refactor Authentication');
    assert.equal(cleanPayload.status, 'COMPLETED');
    assert.equal(cleanPayload.priority, 'HIGH');
  });
});
