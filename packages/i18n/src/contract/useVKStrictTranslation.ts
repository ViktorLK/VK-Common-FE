// [MB.02] Explicit typed hook - Strict Compile-Time Translation Hook
// [BASE-03] Compile-time key inference and interpolation parameter validation
// [AP.01] Modern TypeScript Semantics: Zero any, fully typed interface

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  DefaultTranslationResource,
  VKStrictTranslateFunction,
  VKStrictTranslationReturn,
} from './contract.types.js';

/**
 * Enterprise hook for reading multi-language dictionaries with compile-time strict key checking
 * and mandatory interpolation parameter validation.
 */
export function useVKStrictTranslation<
  TResource = DefaultTranslationResource,
>(ns?: string): VKStrictTranslationReturn<TResource> {
  const { t: rawT, i18n, ready } = useTranslation(ns);

  const t = useCallback<VKStrictTranslateFunction<TResource>>(
    ((key: string, ...args: unknown[]) => {
      if (args.length === 0) {
        return rawT(key);
      }
      const [firstArg, secondArg] = args;
      if (typeof firstArg === 'object' && firstArg !== null) {
        return rawT(key, { ...firstArg, ...(typeof secondArg === 'object' ? secondArg : {}) });
      }
      return rawT(key);
    }) as VKStrictTranslateFunction<TResource>,
    [rawT],
  );

  return {
    t,
    i18nLanguage: i18n?.language ?? 'en-US',
    ready: ready ?? true,
  };
}
