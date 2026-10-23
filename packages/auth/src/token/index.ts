// [MB.02] Explicit barrel export - Token Providers
export {
  VKTokenManager,
  type VKTokenManagerOptions,
} from './vk-token-manager.js';

export {
  VKMemoryTokenProvider,
  createMemoryTokenProvider,
  type VKMemoryTokenProviderOptions,
} from './memory-token-provider.js';

export {
  VKCookieTokenProvider,
  createCookieTokenProvider,
  type VKCookieTokenProviderOptions,
} from './cookie-token-provider.js';

export {
  VKSecureEnclaveTokenProvider,
  createSecureEnclaveTokenProvider,
  type VKSecureEnclaveTokenProviderOptions,
  type IVKAsyncTokenStorage,
} from './secure-enclave-token-provider.js';

export {
  vkTaintAuthTokens,
  vkTaintAuthSession,
} from './server-taint.js';
