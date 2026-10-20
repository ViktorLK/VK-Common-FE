// [CS.01] Robust Zod error mapping into VKError validation objects
import { z } from 'zod';
import { VKError } from '@vk-blocks/core';

/**
 * Formats a Zod issue path array into a standardized property expression.
 * Handles array indices like `items[0].name` and object keys like `user.profile.id`.
 */
export function formatZodIssuePath(path: readonly (string | number)[]): string {
  if (path.length === 0) {
    return 'Payload';
  }

  let formatted = '';
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    if (typeof segment === 'number') {
      formatted += `[${segment}]`;
    } else {
      if (formatted.length > 0) {
        formatted += `.${segment}`;
      } else {
        formatted += segment;
      }
    }
  }

  return formatted;
}

/**
 * Maps Zod runtime validation errors into standardized VKError validation items.
 * Preserves structured array indexing and nested property paths.
 */
export function mapZodErrorToVKErrors(error: z.ZodError): readonly VKError[] {
  return error.issues.map((issue) => {
    const fieldPath = formatZodIssuePath(issue.path);
    return VKError.validation(`Validation.${fieldPath}`, issue.message);
  });
}
