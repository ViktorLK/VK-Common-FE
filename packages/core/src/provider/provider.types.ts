// [ARCH-05] Co-Located Defaults, Deterministic Overrides (Fallback & Provided tiers)
// [MB.03] Typed Provider Registry contracts
import type { VKDisposable } from '../disposable/index.js';

declare const VK_SERVICE_TOKEN: unique symbol;

/**
 * Strongly typed nominal service token for dependency injection.
 */
export interface VKServiceToken<T> {
  readonly name: string;
  readonly [VK_SERVICE_TOKEN]: T;
}

export type VKServiceLifetime = 'singleton' | 'scoped' | 'transient';

export type VKServiceTier = 'fallback' | 'provided';

export type VKServiceFactory<T> = (provider: VKServiceProvider) => T;

export interface VKServiceProvider {
  /**
   * Resolves a registered service or throws a typed VKError if not found.
   */
  readonly get: <T>(token: VKServiceToken<T>) => T;

  /**
   * Resolves a registered service or returns undefined if not found.
   */
  readonly tryGet: <T>(token: VKServiceToken<T>) => T | undefined;

  /**
   * Creates an isolated child scope for scoped services.
   */
  readonly createScope: () => VKServiceProvider & VKDisposable;
}

export interface VKProviderRegistry {
  /**
   * Registers a neutral Fallback implementation with TryAdd semantics (ARCH-05).
   * Will not overwrite an existing fallback or provided service.
   */
  readonly tryAddFallback: <T>(
    token: VKServiceToken<T>,
    factory: VKServiceFactory<T>,
    lifetime?: VKServiceLifetime,
  ) => this;

  /**
   * Registers a Provided-tier service implementation, deterministically overriding any Fallback tier default (ARCH-05).
   */
  readonly register: <T>(
    token: VKServiceToken<T>,
    factory: VKServiceFactory<T>,
    lifetime?: VKServiceLifetime,
  ) => this;

  /**
   * Builds an immutable root VKServiceProvider instance.
   */
  readonly build: () => VKServiceProvider;
}
