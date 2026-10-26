// [MB.02] Explicit typed contracts - Dynamic Namespace Chunking SPI
// [BASE-01] Contract-First type safety
// [AP.01] Modern TypeScript Semantics: Immutable properties, zero any

import type { i18n } from 'i18next';

export type VKResourceBundle = Record<string, unknown>;

export interface VKCachedBundle {
  readonly data: VKResourceBundle;
  readonly timestamp: number;
  readonly version: string;
}

export interface VKCacheStorageAdapter {
  readonly get: (key: string) => VKCachedBundle | null;
  readonly set: (key: string, data: VKCachedBundle) => void;
  readonly remove: (key: string) => void;
  readonly clear: () => void;
}

export type VKNamespaceLoaderFn = (
  locale: string,
  namespace: string,
) => Promise<VKResourceBundle | null>;

export interface VKNamespaceChunkOptions {
  /**
   * Cache schema version for invalidation on app upgrades.
   * @default '1.0.0'
   */
  readonly version?: string;

  /**
   * Time-to-live in milliseconds for cached translation bundles.
   * @default 604800000 (7 days)
   */
  readonly ttlMs?: number;

  /**
   * Custom asynchronous loader delegate (dynamic import, CDN or HTTP fetch).
   */
  readonly loader?: VKNamespaceLoaderFn;

  /**
   * Custom cache storage adapter (defaults to built-in LocalStorage cache with memory fallback).
   */
  readonly cacheStorage?: VKCacheStorageAdapter;

  /**
   * Storage key prefix for cache isolation.
   * @default 'vk-i18n-chunk:'
   */
  readonly storagePrefix?: string;
}

export interface VKNamespaceManager {
  readonly i18nInstance: i18n;

  /**
   * Asynchronously loads a namespace chunk into the active i18n instance.
   * Leverages in-flight deduplication and local cache.
   */
  readonly loadNamespace: (locale: string, namespace: string) => Promise<boolean>;

  /**
   * Asynchronously loads multiple namespace chunks in parallel.
   */
  readonly loadNamespaces: (locale: string, namespaces: string[]) => Promise<boolean>;

  /**
   * Checks whether a namespace bundle is already loaded in the i18n instance.
   */
  readonly isNamespaceLoaded: (locale: string, namespace: string) => boolean;

  /**
   * Prefetches namespace chunks in the background without blocking render.
   */
  readonly prefetchNamespaces: (locale: string, namespaces: string[]) => Promise<void>;

  /**
   * Purges all locally cached translation chunks.
   */
  readonly clearCache: () => void;
}

export interface UseVKNamespaceOptions {
  /**
   * If true, prefetches namespaces in the background without triggering loading states.
   * @default false
   */
  readonly prefetch?: boolean;

  /**
   * Explicit locale override (defaults to active i18n language).
   */
  readonly locale?: string;
}

export interface UseVKNamespaceReturn {
  readonly isLoaded: boolean;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly reload: () => Promise<void>;
}
