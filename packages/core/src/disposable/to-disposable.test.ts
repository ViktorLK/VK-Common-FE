import { describe, it, expect, vi } from 'vitest';
import { toDisposable } from './to-disposable.js';

describe('toDisposable', () => {
  it('calls cleanup once', () => {
    const cleanup = vi.fn();
    const d = toDisposable(cleanup);
    d.dispose();
    d.dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
