// [AP.01] Type-safe path interpolation and query string utilities

export interface QueryStringOptions {
  readonly arrayFormat?: 'repeat' | 'comma';
}

/**
 * Interpolates path parameters into a route template.
 * Supports both Express-style (`:param`) and OpenAPI-style (`{param}`) placeholders.
 *
 * Example:
 * buildApiPath('/users/:userId/posts/{postId}', { userId: '42', postId: '108' })
 * => '/users/42/posts/108'
 */
export function buildApiPath(
  template: string,
  params: Readonly<Record<string, string | number>>,
): string {
  let resolved = template;

  for (const [key, value] of Object.entries(params)) {
    const encodedValue = encodeURIComponent(String(value));
    // Replace :param (word boundary)
    const colonRegex = new RegExp(`:${key}\\b`, 'g');
    // Replace {param}
    const braceRegex = new RegExp(`\\{${key}\\}`, 'g');

    resolved = resolved.replace(colonRegex, encodedValue).replace(braceRegex, encodedValue);
  }

  return resolved;
}

/**
 * Builds a URL query string from a parameters record.
 * Automatically filters out null and undefined values.
 * Supports array parameters via repeated keys or comma-separated format.
 *
 * Example:
 * buildQueryString({ page: 1, tags: ['a', 'b'], active: true })
 * => 'page=1&tags=a&tags=b&active=true'
 */
export function buildQueryString(
  params: Readonly<Record<string, unknown>>,
  options?: QueryStringOptions,
): string {
  const searchParams = new URLSearchParams();
  const arrayFormat = options?.arrayFormat ?? 'repeat';

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      if (arrayFormat === 'comma') {
        const joined = value
          .filter((v) => v !== undefined && v !== null)
          .map(String)
          .join(',');
        if (joined.length > 0) {
          searchParams.append(key, joined);
        }
      } else {
        for (const item of value) {
          if (item !== undefined && item !== null) {
            searchParams.append(key, String(item));
          }
        }
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}
