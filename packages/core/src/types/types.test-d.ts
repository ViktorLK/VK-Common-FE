import { describe, it, expectTypeOf } from 'vitest';
import type {
  Brand,
  Awaitable,
  Prettify,
  Nullable,
  Optional,
  DeepReadonly,
  VKPagedResult,
} from './types.types.js';

describe('types.test-d', () => {
  it('verifies Brand creates nominal types', () => {
    type UserId = Brand<string, 'UserId'>;
    type OrderId = Brand<string, 'OrderId'>;

    expectTypeOf<UserId>().not.toEqualTypeOf<OrderId>();
    expectTypeOf<UserId>().toMatchTypeOf<string>();
  });

  it('verifies Awaitable resolves union of value and promise', () => {
    expectTypeOf<Awaitable<number>>().toEqualTypeOf<number | PromiseLike<number>>();
  });

  it('verifies Prettify keeps object structure identical', () => {
    type Original = { a: number } & { b: string };
    type Prettified = Prettify<Original>;
    expectTypeOf<Prettified>().toEqualTypeOf<{ a: number; b: string }>();
  });

  it('verifies DeepReadonly recurses through objects and arrays', () => {
    type Mutable = { a: number; b: { c: string[] } };
    type ReadonlyType = DeepReadonly<Mutable>;
    expectTypeOf<ReadonlyType>().toEqualTypeOf<{
      readonly a: number;
      readonly b: {
        readonly c: readonly string[];
      };
    }>();
  });

  it('verifies VKPagedResult structure', () => {
    type ItemList = VKPagedResult<{ id: string }>;
    expectTypeOf<ItemList['items']>().toEqualTypeOf<readonly { id: string }[]>();
    expectTypeOf<ItemList['totalCount']>().toBeNumber();
  });
});
