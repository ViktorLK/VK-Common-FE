import { describe, it, expect } from 'vitest';
import { redact } from './redact.js';

describe('redact', () => {
  it('masks sensitive fields, JWT, and bearer tokens', () => {
    const raw = {
      password: 'secretPassword123',
      apiKey: 'xyz-999',
      headers: {
        authorization: 'secret-token',
        customAuth: 'Bearer eyJhbGciOi...',
      },
      jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakSignature',
      user: 'alice',
    };

    const sanitized = redact(raw);
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.headers.authorization).toBe('[REDACTED]');
    expect(sanitized.headers.customAuth).toBe('Bearer [REDACTED]');
    expect(sanitized.jwtToken).toBe('[REDACTED_JWT]');
    expect(sanitized.user).toBe('alice');
  });

  it('handles Error objects and circular references', () => {
    const err = new Error('Database connection failed');
    const circular: Record<string, unknown> = { error: err };
    circular['self'] = circular;

    const sanitized = redact(circular);
    expect(sanitized.error).toMatchObject({
      name: 'Error',
      message: 'Database connection failed',
    });
    expect(sanitized.self).toBe('[Circular]');
  });
});
