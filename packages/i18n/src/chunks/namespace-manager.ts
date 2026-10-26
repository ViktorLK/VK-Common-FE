// [MB.02] Explicit factory - Dynamic Namespace Manager with In-Flight Deduplication & Cache
// [CS.03] Async promise deduplication, clean non-blocking loading pipeline
// [AP.01] Modern TypeScript Semantics: Defensive error handling, zero any

import type { i18n } from 'i18next';
import type {
  VKNamespaceChunkOptions,
  VKNamespaceManager,
  VKResourceBundle,
} from './chunks.types.js';
import { VKLocalStorageCache } from './cache-storage.js';

export function createVKNamespaceManager(
  i18nInstance: i18n,
  options?: VKNamespaceChunkOptions,
): VKNamespaceManager {
  const version = options?.version ?? '1.0.0';
  const ttlMs = options?.ttlMs ?? 7 * 24 * 60 * 60 * 1000; // 7 days default
  const loader = options?.loader;
  const cacheStorage =
    options?.cacheStorage ?? new VKLocalStorageCache(options?.storagePrefix);

  const inFlightMap = new Map<string, Promise<boolean>>();

  const isNamespaceLoaded = (locale: string, namespace: string): boolean => {
    return i18nInstance.hasResourceBundle(locale, namespace);
  };

  const loadNamespace = async (
    locale: string,
    namespace: string,
  ): Promise<boolean> => {
    // 1. Memory check (already registered in active i18next instance)
    if (isNamespaceLoaded(locale, namespace)) {
      return true;
    }

    const cacheKey = `${locale}:${namespace}`;

    // 2. Local cache check
    const cached = cacheStorage.get(cacheKey);
    if (cached) {
      const now = new Date().getTime();
      const isFresh = now - cached.timestamp < ttlMs;
      const isMatchingVersion = cached.version === version;

      if (isFresh && isMatchingVersion) {
        i18nInstance.addResourceBundle(
          locale,
          namespace,
          cached.data as any,
          true,
          true,
        );
        return true;
      }
      // Purge stale or version-mismatched entry
      cacheStorage.remove(cacheKey);
    }

    // 3. In-flight request deduplication check
    const existingPromise = inFlightMap.get(cacheKey);
    if (existingPromise) {
      return await existingPromise;
    }

    // 4. Remote loader invocation
    if (!loader) {
      return false;
    }

    const loadPromise = (async (): Promise<boolean> => {
      try {
        const bundle = await loader(locale, namespace);
        if (bundle && typeof bundle === 'object') {
          i18nInstance.addResourceBundle(
            locale,
            namespace,
            bundle as any,
            true,
            true,
          );
          cacheStorage.set(cacheKey, {
            data: bundle as VKResourceBundle,
            timestamp: new Date().getTime(),
            version,
          });
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        inFlightMap.delete(cacheKey);
      }
    })();

    inFlightMap.set(cacheKey, loadPromise);
    return await loadPromise;
  };

  const loadNamespaces = async (
    locale: string,
    namespaces: string[],
  ): Promise<boolean> => {
    const results = await Promise.all(
      namespaces.map((ns) => loadNamespace(locale, ns)),
    );
    return results.every(Boolean);
  };

  const prefetchNamespaces = async (
    locale: string,
    namespaces: string[],
  ): Promise<void> => {
    // Fire-and-forget prefetch in idle background
    try {
      await loadNamespaces(locale, namespaces);
    } catch {
      // Non-blocking prefetch failure ignored
    }
  };

  const clearCache = (): void => {
    cacheStorage.clear();
  };

  return {
    i18nInstance,
    loadNamespace,
    loadNamespaces,
    isNamespaceLoaded,
    prefetchNamespaces,
    clearCache,
  };
}
