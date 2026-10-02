const ISO_DATE_REGEXP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * JSON reviver function that automatically restores ISO 8601 date strings to Date objects.
 */
export function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE_REGEXP.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
}
