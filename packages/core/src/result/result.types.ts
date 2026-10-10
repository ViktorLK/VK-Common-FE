// [CS.01] Result Pattern
// [FS-02] Isomorphic VKResult<T, E> definition
import type { VKError } from '../errors/vk-error.js';

export type VKOk<T> = {
  readonly isSuccess: true;
  readonly isFailure: false;
  readonly value: T;
  readonly errors: readonly [];
};

export type VKErr<E = VKError> = {
  readonly isSuccess: false;
  readonly isFailure: true;
  readonly value: undefined;
  readonly errors: readonly E[];
  readonly error: E;
};

export type VKResult<T, E = VKError> = VKOk<T> | VKErr<E>;

export type VKVoidOk = {
  readonly isSuccess: true;
  readonly isFailure: false;
  readonly errors: readonly [];
};

export type VKVoidErr<E = VKError> = {
  readonly isSuccess: false;
  readonly isFailure: true;
  readonly errors: readonly E[];
  readonly error: E;
};

export type VKVoidResult<E = VKError> = VKVoidOk | VKVoidErr<E>;

/**
 * Either functional alias where Left represents failure (E) and Right represents success (T).
 */
export type VKEither<L = VKError, R = unknown> = VKResult<R, L>;

