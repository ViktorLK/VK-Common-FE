// [AP.01] Modern Zero-Annotation Type Inference Primitives
// [BASE-01] Contract-First Type Gymnastics

/**
 * Recursively unwraps Promise or Awaitable types to their resolved value.
 */
export type VKUnwrapPromise<T> = T extends PromiseLike<infer U> ? VKUnwrapPromise<U> : T;

/**
 * Extracts the return type of a function without manual generic annotations.
 */
export type VKInferReturn<T> = T extends (...args: never[]) => infer R ? R : never;

/**
 * Extracts the parameters tuple of a function.
 */
export type VKInferParams<T> = T extends (...args: infer P) => unknown ? P : never;

/**
 * Deep conditional pick extracting matching value types from an object structure.
 */
export type VKDeepPick<T, TTarget> = {
  [K in keyof T]: T[K] extends TTarget
    ? T[K]
    : T[K] extends object
    ? VKDeepPick<T[K], TTarget>
    : never;
};

/**
 * Automatically infers and narrows non-nullable dictionary values.
 */
export type VKNarrowRecord<T extends Record<string, unknown>> = {
  readonly [K in keyof T]-?: NonNullable<T[K]>;
};
