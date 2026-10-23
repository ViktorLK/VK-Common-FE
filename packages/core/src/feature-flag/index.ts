// [MB.02] Explicit barrel export - Feature Flag module
export type {
  VKFeatureFlagContext,
  VKFeatureFlagRegistry,
  VKFeatureFlagKey,
  VKFeatureFlagRule,
  VKFeatureFlagDetailedValue,
  VKFeatureFlagRawValue,
  VKFeatureFlagProvider,
  VKFeatureFlagStore,
  VKRemoteFeatureFlagProvider,
  VKRemoteFeatureFlagFetcher,
  VKRemoteFeatureFlagProviderOptions,
  VKDehydratedFeatureFlags,
} from './feature-flag.types.js';
export {
  DefaultFeatureFlagProvider,
  createVKFeatureFlagProvider,
  createVKFeatureFlagStore,
  DefaultRemoteFeatureFlagProvider,
  createVKRemoteFeatureFlagProvider,
} from './default-feature-flag-provider.js';
export {
  VKFeatureFlagErrorCodes,
  type VKFeatureFlagErrorCode,
  vkEvaluateRollout,
  tryEvaluateRollout,
  evaluateRollout,
} from './evaluate-rollout.js';
export {
  evaluateFlagEnabled,
  evaluateFlagValue,
} from './evaluate-flag.js';
export {
  type VKDehydrateOptions,
  dehydrateFeatureFlags,
  hydrateFeatureFlags,
  vkDehydrateFeatureFlags,
  vkHydrateFeatureFlags,
} from './feature-flag-hydration.js';
