// [AP.01] Modern TypeScript type guard
/**
 * Type guard: value is a valid value of a const enum-like object.
 */
export function isMemberOf<T extends Record<string, unknown>>(
  enumObj: T,
  value: unknown,
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}
