import { describe, it, expectTypeOf } from 'vitest';
import { VKResult } from './vk-result.js';
import type { VKResult as VKResultType, VKVoidResult } from './result.types.js';
import type { VKError } from '../errors/vk-error.js';

describe('result.test-d', () => {
  it('verifies VKResult success narrows value correctly', () => {
    const res = VKResult.success(123);
    if (res.isSuccess) {
      expectTypeOf(res.value).toBeNumber();
    }
  });

  it('verifies default error generic is VKError', () => {
    type DefaultResult = VKResultType<string>;
    type ErrorsType = DefaultResult extends { errors: infer E } ? E : never;
    expectTypeOf<ErrorsType>().toMatchTypeOf<readonly VKError[] | readonly []>();
  });

  it('verifies custom error generic', () => {
    type CustomError = { code: string };
    const res = VKResult.failure<string, CustomError>({ code: 'CUSTOM' });
    if (res.isFailure) {
      expectTypeOf(res.errors).toEqualTypeOf<readonly CustomError[]>();
    }
  });

  it('verifies VKVoidResult type structure', () => {
    const voidRes = VKResult.void.success();
    expectTypeOf(voidRes).toMatchTypeOf<VKVoidResult>();
  });
});
