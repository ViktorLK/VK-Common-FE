// [AP.01] Modern TypeScript type guard
/**
 * Type guard: value is a plain JavaScript object literal or Object.create(null).
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}
