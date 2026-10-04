import { describe, it, expectTypeOf } from 'vitest';
import type { VKIdGenerator, VKTimeProvider, VKSerializer } from './abstractions.types.js';

describe('abstractions.test-d', () => {
  it('verifies VKIdGenerator contract', () => {
    expectTypeOf<VKIdGenerator['generate']>().returns.toBeString();
  });

  it('verifies VKTimeProvider contract', () => {
    expectTypeOf<VKTimeProvider['now']>().returns.toEqualTypeOf<Date>();
    expectTypeOf<VKTimeProvider['timestamp']>().returns.toBeNumber();
  });

  it('verifies VKSerializer contract', () => {
    expectTypeOf<VKSerializer['serialize']>().toBeFunction();
    expectTypeOf<VKSerializer['deserialize']>().toBeFunction();
  });
});
