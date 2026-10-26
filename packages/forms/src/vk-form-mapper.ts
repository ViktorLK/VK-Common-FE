// [FS-02] [CS.01] [AP.01] RFC 7807 ProblemDetails & VKResult Form Error Mappers
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { VKResult, VKError, VKErrorCategory, vkAssert } from '@vk-blocks/core';

export interface VKProblemDetailsPayload {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly errors?: Record<string, readonly string[] | string>;
}

export interface MapErrorsOptions<TFieldValues extends FieldValues> {
  /**
   * Custom function to extract form field name or path from a VKError.
   * If not provided, it normalizes error extensions/fieldErrors or searches error code tokens case-insensitively.
   */
  readonly getFieldName?: (error: VKError) => string | null;

  /**
   * Whether to map unmatched errors to the form root error ('root.server').
   * When true, domain invariant or unmapped validation errors are not dropped.
   * @default true
   */
  readonly fallbackToRoot?: boolean;

  /**
   * Target root error subkey or path in React Hook Form.
   * @default 'root.server'
   */
  readonly rootErrorKey?: 'root' | 'root.server' | string;
}

/**
 * Normalizes server field locators (RFC 6901 JSON Pointers, array brackets, dot-notation)
 * into standard React Hook Form dot-separated path strings.
 * Examples:
 * - "/items/0/skuId" -> "items.0.skuId"
 * - "items[0].skuId" -> "items.0.skuId"
 * - "User.Profile.Name" -> "User.Profile.Name"
 * - "email" -> "email"
 */
export function parseServerFieldPath(rawPath: string): string {
  if (!rawPath) return '';
  return rawPath
    .trim()
    .replace(/^\/+/, '') // strip leading slash
    .replace(/\/+/g, '.') // convert / to .
    .replace(/\[(\d+)\]/g, '.$1') // convert [0] to .0
    .replace(/^\.+|\.+$/g, '') // strip leading and trailing dots
    .replace(/\.{2,}/g, '.'); // collapse multiple dots
}

/**
 * Maps standard @vk-blocks/core VKResult validation errors to React Hook Form errors.
 * Employs a two-tier error distribution pipeline:
 * 1. Matches field-level errors to explicit form controls.
 * 2. Collects unmapped domain invariant or cross-field violations to `root.server`.
 *
 * Returns true if validation errors were found and mapped, false otherwise.
 */
export function mapVKResultErrorsToFormErrors<TFieldValues extends FieldValues>(
  result: VKResult<unknown> | { readonly errors: readonly VKError[] },
  form: UseFormReturn<TFieldValues>,
  options?: MapErrorsOptions<TFieldValues>,
): boolean {
  // [AP.01] Boundary assertions
  vkAssert.notNull(result, 'result');
  vkAssert.notNull(form, 'form');

  const errors = 'errors' in result ? result.errors : [];
  if (!errors || errors.length === 0) {
    return false;
  }

  // Filter for validation errors per FS-02
  const validationErrors = errors.filter(
    (err) => err.category === VKErrorCategory.Validation || err.type === VKErrorCategory.Validation,
  );
  if (validationErrors.length === 0) {
    return false;
  }

  const fallbackToRoot = options?.fallbackToRoot ?? true;
  const rootErrorKey = options?.rootErrorKey ?? 'root.server';
  const formFields = Object.keys(form.getValues()) as string[];

  const getFieldName =
    options?.getFieldName ??
    ((error: VKError) => {
      // 1. Check if error has structured fieldErrors
      if (error.fieldErrors && error.fieldErrors.length > 0) {
        for (const fe of error.fieldErrors) {
          const normalized = parseServerFieldPath(fe.path);
          const match = formFields.find(
            (f) => f === normalized || f.toLowerCase() === normalized.toLowerCase(),
          );
          if (match) return match;
        }
      }

      // 2. Check if error.extensions has explicit field, path, or propertyName
      if (error.extensions && typeof error.extensions === 'object') {
        const rawMetaField =
          error.extensions['field'] ??
          error.extensions['path'] ??
          error.extensions['propertyName'];
        if (typeof rawMetaField === 'string' && rawMetaField.length > 0) {
          const normalized = parseServerFieldPath(rawMetaField);
          const metaMatch = formFields.find(
            (f) => f === normalized || f.toLowerCase() === normalized.toLowerCase(),
          );
          if (metaMatch) return metaMatch;
        }
      }

      // 3. Split error code by "." (e.g. "User.Email.Required")
      const tokens = error.code.split('.');
      for (const token of tokens) {
        const match = formFields.find((field) => field.toLowerCase() === token.toLowerCase());
        if (match) {
          return match;
        }
      }
      return null;
    });

  let mappedAny = false;

  for (const error of validationErrors) {
    const fieldName = getFieldName(error);
    if (fieldName && formFields.includes(fieldName)) {
      form.setError(fieldName as Path<TFieldValues>, {
        type: 'server',
        message: error.description,
      });
      mappedAny = true;
    } else if (fallbackToRoot) {
      form.setError(rootErrorKey as Path<TFieldValues>, {
        type: 'server',
        message: error.description,
      });
      mappedAny = true;
    }
  }

  return mappedAny;
}

/**
 * Maps RFC 7807 ProblemDetails structured `errors` dictionary directly to React Hook Form field errors.
 * Normalizes JSON Pointer paths, array brackets, and keys case-insensitively against active form fields.
 * Any unmatched server errors or root detail are automatically redirected to `root.server`.
 */
export function mapVKProblemDetailsToFormErrors<TFieldValues extends FieldValues>(
  problemDetails: VKProblemDetailsPayload | null | undefined,
  form: UseFormReturn<TFieldValues>,
  options?: MapErrorsOptions<TFieldValues>,
): boolean {
  if (!problemDetails) {
    return false;
  }

  // [AP.01] Boundary assertions
  vkAssert.notNull(form, 'form');

  const fallbackToRoot = options?.fallbackToRoot ?? true;
  const rootErrorKey = options?.rootErrorKey ?? 'root.server';
  const formFields = Object.keys(form.getValues()) as string[];
  let mappedAny = false;

  if (problemDetails.errors && Object.keys(problemDetails.errors).length > 0) {
    for (const [key, val] of Object.entries(problemDetails.errors)) {
      const rawMessage = Array.isArray(val) ? val[0] : val;
      if (!rawMessage) continue;

      const normalizedKey = parseServerFieldPath(key);

      // Direct match or case-insensitive match against form fields
      const targetField =
        formFields.find((f) => f === normalizedKey) ??
        formFields.find((f) => f.toLowerCase() === normalizedKey.toLowerCase());

      if (targetField) {
        form.setError(targetField as Path<TFieldValues>, {
          type: 'server',
          message: String(rawMessage),
        });
        mappedAny = true;
      } else if (fallbackToRoot) {
        form.setError(rootErrorKey as Path<TFieldValues>, {
          type: 'server',
          message: String(rawMessage),
        });
        mappedAny = true;
      }
    }
  } else if (problemDetails.detail && fallbackToRoot) {
    // ProblemDetails with no field dictionary: map top-level detail to root
    form.setError(rootErrorKey as Path<TFieldValues>, {
      type: 'server',
      message: problemDetails.detail,
    });
    mappedAny = true;
  }

  return mappedAny;
}
