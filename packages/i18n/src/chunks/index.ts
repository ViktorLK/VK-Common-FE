// [MB.02] Explicit barrel export - Dynamic Namespace Chunking SPI
export { createVKNamespaceManager } from './namespace-manager.js';
export { VKLocalStorageCache, VKMemoryCache } from './cache-storage.js';
export {
  VKNamespaceProvider,
  useVKNamespaceManager,
  type VKNamespaceProviderProps,
} from './VKNamespaceContext.js';
export { useVKNamespace } from './useVKNamespace.js';
export type {
  VKResourceBundle,
  VKCachedBundle,
  VKCacheStorageAdapter,
  VKNamespaceLoaderFn,
  VKNamespaceChunkOptions,
  VKNamespaceManager,
  UseVKNamespaceOptions,
  UseVKNamespaceReturn,
} from './chunks.types.js';
