import { describe, it, expect, vi } from 'vitest';
import { DisposableStore } from './disposable-store.js';
import { toDisposable } from './to-disposable.js';

describe('DisposableStore', () => {
  it('tracks and disposes all added items', () => {
    const store = new DisposableStore();
    const c1 = vi.fn();
    const c2 = vi.fn();

    store.add(toDisposable(c1));
    store.add(toDisposable(c2));
    expect(store.isDisposed).toBe(false);

    store.dispose();
    expect(store.isDisposed).toBe(true);
    expect(c1).toHaveBeenCalledTimes(1);
    expect(c2).toHaveBeenCalledTimes(1);

    // Adding after disposal invokes dispose immediately
    const c3 = vi.fn();
    store.add(toDisposable(c3));
    expect(c3).toHaveBeenCalledTimes(1);
  });

  it('aggregates errors on clear when no onError is supplied', () => {
    const store = new DisposableStore();
    store.add({
      dispose: () => {
        throw new Error('Fail A');
      },
    });
    store.add({
      dispose: () => {
        throw new Error('Fail B');
      },
    });

    expect(() => store.clear()).toThrow();
  });

  it('routes errors to onError if configured on store', () => {
    const onError = vi.fn();
    const store = new DisposableStore({ onError });
    store.add({
      dispose: () => {
        throw new Error('Fail A');
      },
    });

    store.dispose();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
