// [MB.02] Explicit typed contracts - Strict i18n Contract Engine
// [BASE-01] Contract-First type safety
// [BASE-03] Compile-time first: blocking builds on missing keys or invalid interpolation args
// [AP.01] Modern TypeScript Semantics: Recursive conditional types, zero any

import type { defaultResources } from '../resources.js';

export type DefaultTranslationResource = typeof defaultResources['en-US']['translation'];

/**
 * Recursively extracts dot-notated leaf keys from translation dictionary T.
 */
export type ExtractTranslationKeys<T, Prefix extends string = ''> = T extends string
  ? Prefix extends `${infer P}.`
    ? P
    : Prefix
  : T extends object
  ? {
      [K in keyof T & string]: ExtractTranslationKeys<T[K], `${Prefix}${K}.`>;
    }[keyof T & string]
  : never;

/**
 * Resolves the leaf value type from a dot-notated path key.
 */
export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * Extracts {{variable}} placeholder names from template string S into an argument record.
 */
export type ExtractInterpolationParams<S extends string> =
  S extends `${string}{{${infer Param}}}${infer Rest}`
    ? { [K in Param | keyof ExtractInterpolationParams<Rest>]: string | number }
    : Record<string, never>;

/**
 * Determines whether interpolation params are mandatory or optional.
 */
export type InterpolationArgs<TVal> = TVal extends string
  ? [keyof ExtractInterpolationParams<TVal>] extends [never]
    ? [params?: Record<string, unknown>, options?: Record<string, unknown>]
    : [params: ExtractInterpolationParams<TVal>, options?: Record<string, unknown>]
  : [params?: Record<string, unknown>, options?: Record<string, unknown>];

/**
 * Compile-time strict translation function enforcing valid keys and interpolation parameters.
 */
export interface VKStrictTranslateFunction<TResource> {
  <
    TKey extends ExtractTranslationKeys<TResource>,
    TVal = PathValue<TResource, TKey>
  >(
    key: TKey,
    ...args: InterpolationArgs<TVal>
  ): string;
}

export interface VKStrictTranslationReturn<TResource> {
  /**
   * Type-safe translation function with compile-time key and interpolation enforcement.
   */
  readonly t: VKStrictTranslateFunction<TResource>;

  /**
   * Current active language code.
   */
  readonly i18nLanguage: string;

  /**
   * Ready status of the translation instance.
   */
  readonly ready: boolean;
}
