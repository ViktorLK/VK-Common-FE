// [AP.01] Modern TypeScript type guard
/**
 * Type guard: value is a non-empty trimmed string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
