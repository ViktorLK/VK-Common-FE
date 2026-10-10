// [AP.01] Duck-typed structural interfaces for boundary guards

export interface VKErrorLike {
  readonly code: string;
  readonly description: string;
  readonly type?: string;
  readonly [key: string]: unknown;
}

export interface VKResultLike<T = unknown> {
  readonly isSuccess: boolean;
  readonly isFailure: boolean;
  readonly value?: T;
  readonly errors: readonly unknown[];
}
