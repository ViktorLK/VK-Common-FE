import { describe, it, expectTypeOf } from 'vitest';
import type { VKDisposable, VKAsyncDisposable } from './disposable.types.js';

describe('disposable.test-d', () => {
  it('verifies VKDisposable has dispose method', () => {
    expectTypeOf<VKDisposable>().toHaveProperty('dispose');
    expectTypeOf<VKDisposable['dispose']>().toEqualTypeOf<() => void>();
  });

  it('verifies VKAsyncDisposable has disposeAsync method', () => {
    expectTypeOf<VKAsyncDisposable>().toHaveProperty('disposeAsync');
    expectTypeOf<VKAsyncDisposable['disposeAsync']>().toEqualTypeOf<() => Promise<void>>();
  });
});
