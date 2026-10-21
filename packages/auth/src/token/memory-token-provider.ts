// [ARCH-05] [BASE-02] Volatile In-Memory Token Provider
import { VKTokenManager, type VKTokenManagerOptions } from './vk-token-manager.js';

export interface VKMemoryTokenProviderOptions extends VKTokenManagerOptions {}

/**
 * High-performance volatile in-memory Token Provider.
 * Holds authentication tokens strictly inside class instance memory,
 * preventing accidental exposure to global windows or unconstrained storage.
 */
export class VKMemoryTokenProvider extends VKTokenManager {
  constructor(options: VKMemoryTokenProviderOptions = {}) {
    super(options);
  }
}

/**
 * Creates an instance of VKMemoryTokenProvider.
 */
export function createMemoryTokenProvider(
  options?: VKMemoryTokenProviderOptions,
): VKMemoryTokenProvider {
  return new VKMemoryTokenProvider(options);
}
