// [MB.02] Explicit typed hook - Declarative Dynamic Namespace Loading Hook
// [CS.03] Non-blocking async chunk loading with error handling
// [AP.01] Modern TypeScript Semantics: Zero any, fully typed interface

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  UseVKNamespaceOptions,
  UseVKNamespaceReturn,
} from './chunks.types.js';
import { useVKNamespaceManager } from './VKNamespaceContext.js';

/**
 * Declarative hook for dynamic on-demand namespace chunk loading.
 * Coordinates smooth loading transitions and automatically syncs across language changes.
 */
export function useVKNamespace(
  namespaces: string | string[],
  options?: UseVKNamespaceOptions,
): UseVKNamespaceReturn {
  const { i18n } = useTranslation();
  const manager = useVKNamespaceManager();

  const nsList = useMemo(() => {
    return Array.isArray(namespaces) ? namespaces : [namespaces];
  }, [namespaces]);

  const activeLocale = options?.locale ?? i18n?.language ?? 'en-US';
  const prefetchOnly = options?.prefetch ?? false;

  const checkAllLoaded = useCallback(() => {
    if (!i18n) return true;
    return nsList.every((ns) => {
      if (manager) {
        return manager.isNamespaceLoaded(activeLocale, ns);
      }
      return i18n.hasResourceBundle ? i18n.hasResourceBundle(activeLocale, ns) : true;
    });
  }, [i18n, manager, nsList, activeLocale]);

  const [isLoaded, setIsLoaded] = useState<boolean>(() => checkAllLoaded());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (checkAllLoaded()) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    if (!manager) {
      // Without manager, cannot fetch asynchronously
      setIsLoaded(true);
      return;
    }

    if (!prefetchOnly) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const success = await manager.loadNamespaces(activeLocale, nsList);
      if (success) {
        setIsLoaded(true);
      } else {
        setError(new Error(`Failed to load namespaces: ${nsList.join(', ')}`));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (!prefetchOnly) {
        setIsLoading(false);
      }
    }
  }, [checkAllLoaded, manager, prefetchOnly, activeLocale, nsList]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (checkAllLoaded()) {
        if (!isCancelled) {
          setIsLoaded(true);
          setIsLoading(false);
        }
        return;
      }
      await load();
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [activeLocale, nsList, load, checkAllLoaded]);

  return {
    isLoaded,
    isLoading,
    error,
    reload: load,
  };
}
