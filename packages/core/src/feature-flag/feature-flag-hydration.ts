import type {
  VKFeatureFlagProvider,
  VKFeatureFlagStore,
  VKFeatureFlagKey,
  VKFeatureFlagContext,
  VKDehydratedFeatureFlags,
} from './feature-flag.types.js';
import type { VKClock } from '../abstractions/abstractions.types.js';
import { createVKFeatureFlagProvider } from './default-feature-flag-provider.js';

export interface VKDehydrateOptions {
  readonly keys?: readonly VKFeatureFlagKey[];
  readonly context?: VKFeatureFlagContext;
  readonly clock?: VKClock;
}

/**
 * Dehydrates feature flags evaluated on the server into a serializable payload for client hydration.
 *
 * @param provider The active feature flag provider.
 * @param options Extraction options (keys, context, clock).
 */
export function dehydrateFeatureFlags(
  provider: VKFeatureFlagProvider,
  options?: VKDehydrateOptions,
): VKDehydratedFeatureFlags {
  const flags: Record<string, unknown> = {};
  const flagKeys = options?.keys;
  const context = options?.context;

  if (flagKeys && flagKeys.length > 0) {
    for (const key of flagKeys) {
      flags[key] = provider.getValue(key, undefined, context);
    }
  } else if (typeof provider.getAllFlags === 'function') {
    Object.assign(flags, provider.getAllFlags());
  }

  const timestamp = options?.clock ? options.clock.timestamp() : Date.now();

  return {
    flags,
    timestamp,
  };
}

/**
 * Hydrates a client-side reactive VKFeatureFlagStore from a dehydrated server payload.
 */
export function hydrateFeatureFlags(
  state: VKDehydratedFeatureFlags,
): VKFeatureFlagStore {
  return createVKFeatureFlagProvider(state?.flags ?? {});
}

export const vkDehydrateFeatureFlags = dehydrateFeatureFlags;
export const vkHydrateFeatureFlags = hydrateFeatureFlags;

