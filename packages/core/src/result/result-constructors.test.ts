import { describe, it, expect } from 'vitest';
import {
  vkOk,
  vkErr,
  vkIsOk,
  vkIsErr,
  vkFromPromise,
  vkUnwrapOrThrow,
} from './result-constructors.js';
import { VKError } from '../errors/vk-error.js';

describe('Result constructors and pure utilities (CS.01 / FS-02)', () => {
  it('vkOk creates a successful VKResult with single value', () => {
    const res = vkOk({ id: 123 });
    expect(res.isSuccess).toBe(true);
    expect(res.isFailure).toBe(false);
    expect(res.value).toEqual({ id: 123 });
    expect(res.errors).toEqual([]);
    expect(vkIsOk(res)).toBe(true);
    expect(vkIsErr(res)).toBe(false);
  });

  it('vkErr creates a failed VKResult with single error and errors array', () => {
    const err = VKError.validation('Input.Invalid', 'Field is invalid');
    const res = vkErr(err);
    expect(res.isSuccess).toBe(false);
    expect(res.isFailure).toBe(true);
    expect(res.value).toBeUndefined();
    expect(res.error).toBe(err);
    expect(res.errors).toEqual([err]);
    expect(vkIsOk(res)).toBe(false);
    expect(vkIsErr(res)).toBe(true);
  });

  it('vkFromPromise wraps resolved promise into vkOk', async () => {
    const promise = Promise.resolve('data payload');
    const res = await vkFromPromise(promise);
    expect(vkIsOk(res)).toBe(true);
    if (vkIsOk(res)) {
      expect(res.value).toBe('data payload');
    }
  });

  it('vkFromPromise normalizes rejected exception to VKError', async () => {
    const promise = Promise.reject(new Error('Network failure'));
    const res = await vkFromPromise(promise);
    expect(vkIsErr(res)).toBe(true);
    if (vkIsErr(res)) {
      expect(res.error).toBeInstanceOf(VKError);
      expect(res.error.message).toBe('Network failure');
    }
  });

  it('vkUnwrapOrThrow returns value for ok result', () => {
    const res = vkOk('unwrapped value');
    expect(vkUnwrapOrThrow(res)).toBe('unwrapped value');
  });

  it('vkUnwrapOrThrow throws VKError for err result', () => {
    const err = VKError.notFound('User.NotFound', 'User does not exist');
    const res = vkErr(err);
    expect(() => vkUnwrapOrThrow(res)).toThrow(VKError);
  });
});
