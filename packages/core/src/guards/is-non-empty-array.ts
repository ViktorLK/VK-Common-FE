// [AP.01] Modern TypeScript type guard
/**
 * Type guard: value is a non-empty array or readonly array.
 */
export function isNonEmptyArray<T>(
  value: readonly T[] | null | undefined,
): value is readonly [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}
