import type { VKResult } from '../result/vk-result.js';

export interface VKFeatureFlagContext {
  readonly userId?: string;
  readonly tenantId?: string;
  readonly [key: string]: unknown;
}

/**
 * Advanced targeting and progressive rollout rules for dynamic feature evaluation.
 */
export interface VKFeatureFlagRule {
  /**
   * Progressive rollout threshold between 0 and 100.
   */
  readonly rolloutPercentage?: number;
  /**
   * User IDs allowed to access the feature regardless of rollout.
   */
  readonly targetUserIds?: readonly string[];
  /**
   * Tenant IDs allowed to access the feature regardless of rollout.
   */
  readonly targetTenantIds?: readonly string[];
  /**
   * Key-value attribute matching constraints (e.g. tier: 'enterprise', env: 'production').
   */
  readonly conditions?: Readonly<Record<string, unknown>>;
}

/**
 * Structured feature flag definition with optional rule-based evaluation.
 */
export interface VKFeatureFlagDetailedValue<T = unknown> {
  readonly enabled: boolean;
  readonly value?: T;
  readonly rule?: VKFeatureFlagRule;
}

export type VKFeatureFlagRawValue =
  | boolean
  | string
  | number
  | VKFeatureFlagDetailedValue<unknown>;

/**
 * Empty interface intended for Declaration Merging to provide compile-time safety for feature flag keys.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VKFeatureFlagRegistry {}

export type VKFeatureFlagKey = keyof VKFeatureFlagRegistry extends never
  ? string
  : keyof VKFeatureFlagRegistry & string;

export interface VKFeatureFlagProvider {
  readonly isEnabled: (flagName: VKFeatureFlagKey, context?: VKFeatureFlagContext) => boolean;
  readonly getValue: <T>(flagName: VKFeatureFlagKey, defaultValue: T, context?: VKFeatureFlagContext) => T;
  readonly getAllFlags?: () => Readonly<Record<string, unknown>>;
}

/**
 * Reactive feature flag store supporting subscription and snapshot access,
 * fully conforming to useSyncExternalStore protocol (Zero React dependency).
 */
export interface VKFeatureFlagStore extends VKFeatureFlagProvider {
  /**
   * Subscribes to flag updates (from remote fetch, WebSocket push, or local update).
   * Returns an unsubscribe function.
   */
  readonly subscribe: (listener: () => void) => () => void;
  /**
   * Retrieves the current immutable snapshot of flags for client hydration.
   */
  readonly getSnapshot: () => Readonly<Record<string, unknown>>;
  /**
   * Retrieves the server-side snapshot of flags for SSR / RSC.
   */
  readonly getServerSnapshot: () => Readonly<Record<string, unknown>>;
  /**
   * Updates or merges flags into the store and notifies all active listeners.
   */
  readonly updateFlags: (newFlags: Readonly<Record<string, unknown>>) => void;
}

export interface VKRemoteFeatureFlagProvider extends VKFeatureFlagStore {
  readonly fetchFlags: (
    context?: VKFeatureFlagContext,
    signal?: AbortSignal,
  ) => Promise<VKResult<Readonly<Record<string, unknown>>>>;
  readonly refresh: (signal?: AbortSignal) => Promise<VKResult<void>>;
}

export type VKRemoteFeatureFlagFetcher = (
  context?: VKFeatureFlagContext,
  signal?: AbortSignal,
) => Promise<VKResult<Readonly<Record<string, unknown>>>>;

export interface VKRemoteFeatureFlagProviderOptions {
  readonly initialFlags?: Readonly<Record<string, unknown>>;
  readonly fetcher: VKRemoteFeatureFlagFetcher;
}

export interface VKDehydratedFeatureFlags {
  readonly flags: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
}

