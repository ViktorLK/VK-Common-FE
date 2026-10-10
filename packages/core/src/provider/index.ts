// [MB.02] Explicit barrel export - @vk-blocks/core/provider
export type {
  VKServiceToken,
  VKServiceLifetime,
  VKServiceTier,
  VKServiceFactory,
  VKServiceProvider,
  VKProviderRegistry,
} from './provider.types.js';

export {
  VKProviderErrorCodes,
} from './provider.errors.js';
export type { VKProviderErrorCode } from './provider.errors.js';

export {
  createVKServiceToken,
} from './vk-service-token.js';

export {
  DefaultProviderRegistry,
  createVKProviderRegistry,
} from './vk-provider-registry.js';
