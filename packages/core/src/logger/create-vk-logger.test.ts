import { describe, it, expect, vi } from 'vitest';
import { createVKLogger } from './create-vk-logger.js';

describe('createVKLogger', () => {
  it('forwards to sink with context and redacted payload', () => {
    const sink = vi.fn();
    const logger = createVKLogger({ sink, level: 'debug' });

    logger.info('User login successful', {
      module: 'auth',
      action: 'login',
      password: 'mypassword',
    });

    expect(sink).toHaveBeenCalledTimes(1);
    const [level, message, payload] = sink.mock.calls[0]!;
    expect(level).toBe('info');
    expect(message).toBe('User login successful');
    expect(payload.password).toBe('[REDACTED]');
    expect(payload.module).toBe('auth');
  });

  it('child logger preserves parent context', () => {
    const sink = vi.fn();
    const parent = createVKLogger({ sink });
    const child = parent.child({ module: 'payment', traceId: 'trace-123' });

    child.info('Processed', { action: 'charge' });
    const [, , payload] = sink.mock.calls[0]!;
    expect(payload.module).toBe('payment');
    expect(payload.traceId).toBe('trace-123');
    expect(payload.action).toBe('charge');
  });
});
