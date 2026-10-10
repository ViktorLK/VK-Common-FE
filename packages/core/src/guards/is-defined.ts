// [AP.01] Modern TypeScript type guard
/**
 * Type guard: value is not null or undefined.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
