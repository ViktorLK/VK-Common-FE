import { describe, it, expect, vi } from 'vitest';
import { combineDisposables } from './combine-disposables.js';
import { toDisposable } from './to-disposable.js';

describe('combineDisposables', () => {
  it('executes all cleanups', () => {
    const c1 = vi.fn();
    const c2 = vi.fn();
    const combined = combineDisposables(toDisposable(c1), toDisposable(c2));
    combined.dispose();
    expect(c1).toHaveBeenCalledTimes(1);
    expect(c2).toHaveBeenCalledTimes(1);
  });

  it('routes cleanup errors to onError if provided', () => {
    const onError = vi.fn();
    const badDisposable = {
      dispose: () => {
        throw new Error('Dispose failed');
      },
    };
    const goodDisposable = toDisposable(vi.fn());

    const combined = combineDisposables({ onError }, badDisposable, goodDisposable);
    combined.dispose();

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('aggregates errors if onError is not provided', () => {
    const bad1 = {
      dispose: () => {
        throw new Error('Err 1');
      },
    };
    const bad2 = {
      dispose: () => {
        throw new Error('Err 2');
      },
    };

    const combined = combineDisposables(bad1, bad2);
    expect(() => combined.dispose()).toThrow();
  });
});
