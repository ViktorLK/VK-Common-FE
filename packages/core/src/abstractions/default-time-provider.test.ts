import { describe, it, expect } from 'vitest';
import { defaultTimeProvider } from './default-time-provider.js';

describe('defaultTimeProvider', () => {
  it('operates using native Date without external libraries', () => {
    const now = defaultTimeProvider.now();
    expect(now).toBeInstanceOf(Date);
    const ts = defaultTimeProvider.timestamp();
    expect(typeof ts).toBe('number');
    expect(ts).toBeGreaterThan(0);
  });
});
