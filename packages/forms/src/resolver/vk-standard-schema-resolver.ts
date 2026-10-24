// [BASE-01] [ARCH-02] [FS-01] [AP.01] Standard Schema v1 Resolver for React Hook Form
import type { Resolver, FieldErrors, FieldValues } from 'react-hook-form';
import {
  isStandardSchema,
  toStandardSchema,
  type StandardSchemaV1,
  type VKLegacySafeParseSchema,
  vkAssert,
} from '@vk-blocks/core';

export interface VKStandardSchemaResolverOptions {
  /**
   * Custom vendor name to report when adapting a legacy safeParse schema.
   * @default 'legacy-schema-adapter'
   */
  readonly vendorName?: string;
}

/**
 * Transforms an array of StandardSchemaV1 issues into React Hook Form nested FieldErrors.
 */
function transformIssuesToFieldErrors<TFieldValues extends FieldValues>(
  issues: ReadonlyArray<StandardSchemaV1.Issue>,
): FieldErrors<TFieldValues> {
  const errors: Record<string, unknown> = {};

  for (const issue of issues) {
    const path = issue.path;

    if (!path || path.length === 0) {
      if (!errors['root']) {
        errors['root'] = {
          type: 'validate',
          message: issue.message,
        };
      }
      continue;
    }

    let current = errors;
    for (let i = 0; i < path.length; i++) {
      const rawSegment = path[i];
      const key =
        typeof rawSegment === 'object' && rawSegment !== null && 'key' in rawSegment
          ? String(rawSegment.key)
          : String(rawSegment);

      if (i === path.length - 1) {
        if (!current[key]) {
          current[key] = {
            type: 'validate',
            message: issue.message,
          };
        }
      } else {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }
    }
  }

  return errors as FieldErrors<TFieldValues>;
}

/**
 * Creates a zero-dependency React Hook Form resolver conforming to the Standard Schema v1 specification.
 * Supports any compliant validation engine (Zod, Valibot, ArkType) via standard `~standard` interface,
 * with seamless automatic fallback for legacy schemas providing `.safeParse()`.
 *
 * @param schema - A StandardSchemaV1 instance or legacy safeParse schema.
 * @param options - Optional resolver configuration.
 */
export function vkStandardSchemaResolver<
  TFieldValues extends FieldValues = FieldValues,
>(
  schema: StandardSchemaV1<unknown, TFieldValues> | VKLegacySafeParseSchema<TFieldValues>,
  options?: VKStandardSchemaResolverOptions,
): Resolver<TFieldValues> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(schema, 'schema');

  const standardSchema: StandardSchemaV1<unknown, TFieldValues> = isStandardSchema(schema)
    ? (schema as StandardSchemaV1<unknown, TFieldValues>)
    : toStandardSchema(
        schema as VKLegacySafeParseSchema<TFieldValues>,
        options?.vendorName ?? 'legacy-schema-adapter',
      );

  return async (values) => {
    const resultOrPromise = standardSchema['~standard'].validate(values);
    const result =
      resultOrPromise instanceof Promise ||
      (typeof resultOrPromise === 'object' &&
        resultOrPromise !== null &&
        'then' in resultOrPromise)
        ? await resultOrPromise
        : resultOrPromise;

    if (!result.issues || result.issues.length === 0) {
      return {
        values: ((result as { readonly value?: TFieldValues }).value ?? values) as TFieldValues,
        errors: {},
      };
    }

    return {
      values: {},
      errors: transformIssuesToFieldErrors<TFieldValues>(result.issues),
    };
  };
}
