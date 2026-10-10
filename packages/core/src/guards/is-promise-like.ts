// [AP.01] Modern TypeScript type guard
/**
 * Type guard: value is a Promise or PromiseLike (thenable).
 */
export function isPromiseLike<T = unknown>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
