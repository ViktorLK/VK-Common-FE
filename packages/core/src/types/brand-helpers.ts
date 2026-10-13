// [FS-04] Strongly Typed Identifiers and Nominal Brand Helpers
// [AP.01] Modern TypeScript Semantics: strict type checking without any
import type { VKBrand } from './types.types.js';

/**
 * Safely casts a validated primitive string into a strongly-typed nominal branded ID.
 * Zero runtime cost.
 */
export function vkBrand<TBrand extends VKBrand<string, any>>(value: string): TBrand {
  return value as unknown as TBrand;
}

/**
 * Validates and converts a raw string to a branded identifier, rejecting empty/invalid strings.
 */
export function vkAssertBrand<TBrand extends VKBrand<string, any>>(
  value: unknown,
  validator?: (val: string) => boolean,
): TBrand {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError('Expected non-empty string for branded identifier.');
  }
  if (validator && !validator(value)) {
    throw new TypeError(`Invalid format for branded identifier: '${value}'.`);
  }
  return value as unknown as TBrand;
}

/**
 * Type-level route parameter extractor.
 * Infers parameter names from path patterns (e.g. '/tenants/:tenantId/users/:userId').
 */
export type VKInferRouteParams<TPath extends string> =
  TPath extends `${string}:${infer Param}/${infer Rest}`
    ? { readonly [K in Param | keyof VKInferRouteParams<`/${Rest}`>]: string }
    : TPath extends `${string}:${infer Param}`
    ? { readonly [K in Param]: string }
    : Record<string, string>;
