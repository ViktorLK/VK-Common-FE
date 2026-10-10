// [DL.01] Unit tests for VKResult and VKVoidResult
import { describe, it, expect } from 'vitest';
import { VKResult } from './vk-result.js';
import { VKError } from '../errors/index.js';
import { VKResultErrorCodes } from './result.errors.js';

describe('VKResult (CS.01)', () => {
  const testError = VKError.failure('Test.Error', 'Test error description');

  describe('VKResult core constructors', () => {
    it('creates a success result with value', () => {
      const result = VKResult.success(42);
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe(42);
      expect(result.errors).toEqual([]);
    });

    it('creates a failure result with single error', () => {
      const result = VKResult.failure<number>(testError);
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.value).toBeUndefined();
      expect(result.errors).toEqual([testError]);
    });

    it('creates a failureMany result with multiple errors', () => {
      const err1 = VKError.validation('Field1', 'Invalid');
      const err2 = VKError.validation('Field2', 'Required');
      const result = VKResult.failureMany<string>([err1, err2]);
      expect(result.isFailure).toBe(true);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.code).toBe('Field1');
    });

    it('throws if failureMany is called with empty array', () => {
      expect(() => VKResult.failureMany([])).toThrow('must contain at least one error');
    });

    it('VKResult.create returns success for non-null values', () => {
      const result = VKResult.create('hello');
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('VKResult.create returns failure with nullValue for null or undefined', () => {
      const resNull = VKResult.create(null);
      expect(resNull.isFailure).toBe(true);
      expect(resNull.errors[0]?.code).toBe('Core.NullValue');

      const resUndefined = VKResult.create(undefined);
      expect(resUndefined.isFailure).toBe(true);
      expect(resUndefined.errors[0]?.code).toBe('Core.NullValue');
    });
  });

  describe('unwrap and unwrapOr', () => {
    it('unwrap returns value on success', () => {
      const res = VKResult.success('ok');
      expect(VKResult.unwrap(res)).toBe('ok');
    });

    it('unwrap throws VKError on failure', () => {
      const res = VKResult.failure(testError);
      expect(() => VKResult.unwrap(res)).toThrowError(VKError);
    });

    it('unwrapOr returns value on success and fallback on failure', () => {
      expect(VKResult.unwrapOr(VKResult.success(10), 0)).toBe(10);
      expect(VKResult.unwrapOr(VKResult.failure(testError), 0)).toBe(0);
    });
  });

  describe('fromPromise and fromWire', () => {
    it('fromPromise wraps resolved promise into success', async () => {
      const res = await VKResult.fromPromise(Promise.resolve(99));
      expect(res.isSuccess).toBe(true);
      expect(res.value).toBe(99);
    });

    it('fromPromise wraps rejected promise into failure', async () => {
      const res = await VKResult.fromPromise(Promise.reject(new Error('Async boom')));
      expect(res.isFailure).toBe(true);
      expect(res.errors[0]?.description).toBe('Async boom');
    });

    it('fromWire parses successful wire payload', () => {
      const res = VKResult.fromWire({ isSuccess: true, value: { id: 1 } });
      expect(res.isSuccess).toBe(true);
      expect(res.value).toEqual({ id: 1 });
    });

    it('fromWire validates payload with custom parser', () => {
      const parser = (val: unknown) => {
        if (typeof val === 'number') return VKResult.success(val * 2);
        return VKResult.failure(VKError.validation('NotNumber', 'Expected number'));
      };
      const resValid = VKResult.fromWire({ isSuccess: true, value: 21 }, parser);
      expect(resValid.isSuccess).toBe(true);
      expect(resValid.value).toBe(42);

      const resInvalid = VKResult.fromWire({ isSuccess: true, value: 'str' }, parser);
      expect(resInvalid.isFailure).toBe(true);
      expect(resInvalid.errors[0]?.code).toBe('NotNumber');
    });

    it('fromWire parses RFC 7807 problem details', () => {
      const res = VKResult.fromWire({
        status: 404,
        title: 'Not Found',
        detail: 'The entity was missing',
        code: 'Entity.NotFound',
      });
      expect(res.isFailure).toBe(true);
      expect(res.errors[0]?.code).toBe('Entity.NotFound');
      expect(res.errors[0]?.status).toBe(404);
    });

    it('fromWire uses WireUnknown fallback when code is missing', () => {
      const res = VKResult.fromWire({
        status: 500,
        title: 'Internal Server Error',
      });
      expect(res.isFailure).toBe(true);
      expect(res.errors[0]?.code).toBe(VKResultErrorCodes.WireUnknown);
    });
  });

  describe('VKVoidResult constructors', () => {
    it('creates void success', () => {
      const res = VKResult.void.success();
      expect(res.isSuccess).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it('creates void failure', () => {
      const res = VKResult.void.failure(testError);
      expect(res.isFailure).toBe(true);
      expect(res.errors).toEqual([testError]);
    });

    it('creates void failureMany', () => {
      const res = VKResult.void.failureMany([testError]);
      expect(res.isFailure).toBe(true);
      expect(res.errors).toEqual([testError]);
    });
  });

  describe('combinators (map, bind, match, mapError)', () => {
    it('map transforms success value', () => {
      const res = VKResult.map(VKResult.success(2), (x) => x * 2);
      expect(res.value).toBe(4);
    });

    it('bind chains result operations', () => {
      const res = VKResult.bind(VKResult.success(5), (x) => VKResult.success(x + 5));
      expect(res.value).toBe(10);
    });

    it('match dispatches success and failure', () => {
      const successVal = VKResult.match(
        VKResult.success('win'),
        (v) => `Success: ${v}`,
        () => 'Fail',
      );
      expect(successVal).toBe('Success: win');

      const failVal = VKResult.match(
        VKResult.failure(testError),
        () => 'Win',
        (errs) => `Failed with ${errs.length} errors`,
      );
      expect(failVal).toBe('Failed with 1 errors');
    });

    it('mapError transforms all errors', () => {
      const err1 = VKError.validation('E1', 'first');
      const err2 = VKError.validation('E2', 'second');
      const failMany = VKResult.failureMany([err1, err2]);

      const mapped = VKResult.mapError(failMany, (e) => `Mapped: ${e.code}`);
      expect(mapped.isFailure).toBe(true);
      expect(mapped.errors).toEqual(['Mapped: E1', 'Mapped: E2']);
    });
  });
});
