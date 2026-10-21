// [MB.05] Feature Flag default in-memory, reactive store, and remote provider
// [AP.01] Modern TypeScript semantics: zero any, defensive checks
import { vkAssert } from '../assert/index.js';
import { VKResult } from '../result/vk-result.js';
import { evaluateFlagEnabled, evaluateFlagValue } from './evaluate-flag.js';
import type {
  VKFeatureFlagContext,
  VKFeatureFlagKey,
  VKFeatureFlagStore,
  VKRemoteFeatureFlagProvider,
  VKRemoteFeatureFlagFetcher,
  VKRemoteFeatureFlagProviderOptions,
} from './feature-flag.types.js';

export class DefaultFeatureFlagProvider implements VKFeatureFlagStore {
  private currentFlags: Record<string, unknown>;
  private readonly listeners = new Set<() => void>();

  constructor(initialFlags: Readonly<Record<string, unknown>> = {}) {
    this.currentFlags = { ...initialFlags };
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.getServerSnapshot = this.getServerSnapshot.bind(this);
    this.isEnabled = this.isEnabled.bind(this);
    this.getValue = this.getValue.bind(this);
    this.getAllFlags = this.getAllFlags.bind(this);
    this.updateFlags = this.updateFlags.bind(this);
  }

  isEnabled(flagName: VKFeatureFlagKey, context?: VKFeatureFlagContext): boolean {
    const val = this.currentFlags[flagName];
    return evaluateFlagEnabled(flagName, val, context);
  }

  getValue<T>(flagName: VKFeatureFlagKey, defaultValue: T, context?: VKFeatureFlagContext): T {
    const val = this.currentFlags[flagName];
    return evaluateFlagValue(flagName, val, defaultValue, context);
  }

  getAllFlags(): Readonly<Record<string, unknown>> {
    return this.currentFlags;
  }

  subscribe(listener: () => void): () => void {
    vkAssert.notNull(listener, 'listener');
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): Readonly<Record<string, unknown>> {
    return this.currentFlags;
  }

  getServerSnapshot(): Readonly<Record<string, unknown>> {
    return this.currentFlags;
  }

  updateFlags(newFlags: Readonly<Record<string, unknown>>): void {
    vkAssert.notNull(newFlags, 'newFlags');
    this.currentFlags = { ...this.currentFlags, ...newFlags };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export function createVKFeatureFlagStore(
  initialFlags: Readonly<Record<string, unknown>> = {},
): VKFeatureFlagStore {
  return new DefaultFeatureFlagProvider(initialFlags);
}

export function createVKFeatureFlagProvider(
  flags: Readonly<Record<string, unknown>> = {},
): VKFeatureFlagStore {
  return new DefaultFeatureFlagProvider(flags);
}

export class DefaultRemoteFeatureFlagProvider implements VKRemoteFeatureFlagProvider {
  private currentFlags: Record<string, unknown>;
  private readonly fetcher: VKRemoteFeatureFlagFetcher;
  private readonly listeners = new Set<() => void>();

  constructor(options: VKRemoteFeatureFlagProviderOptions) {
    vkAssert.notNull(options, 'options');
    vkAssert.notNull(options.fetcher, 'options.fetcher');
    this.currentFlags = { ...(options.initialFlags ?? {}) };
    this.fetcher = options.fetcher;
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.getServerSnapshot = this.getServerSnapshot.bind(this);
    this.isEnabled = this.isEnabled.bind(this);
    this.getValue = this.getValue.bind(this);
    this.getAllFlags = this.getAllFlags.bind(this);
    this.updateFlags = this.updateFlags.bind(this);
    this.fetchFlags = this.fetchFlags.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  isEnabled(flagName: VKFeatureFlagKey, context?: VKFeatureFlagContext): boolean {
    const val = this.currentFlags[flagName];
    return evaluateFlagEnabled(flagName, val, context);
  }

  getValue<T>(flagName: VKFeatureFlagKey, defaultValue: T, context?: VKFeatureFlagContext): T {
    const val = this.currentFlags[flagName];
    return evaluateFlagValue(flagName, val, defaultValue, context);
  }

  getAllFlags(): Readonly<Record<string, unknown>> {
    return { ...this.currentFlags };
  }

  subscribe(listener: () => void): () => void {
    vkAssert.notNull(listener, 'listener');
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): Readonly<Record<string, unknown>> {
    return this.currentFlags;
  }

  getServerSnapshot(): Readonly<Record<string, unknown>> {
    return this.currentFlags;
  }

  updateFlags(newFlags: Readonly<Record<string, unknown>>): void {
    vkAssert.notNull(newFlags, 'newFlags');
    this.currentFlags = { ...this.currentFlags, ...newFlags };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async fetchFlags(
    context?: VKFeatureFlagContext,
    signal?: AbortSignal,
  ): Promise<VKResult<Readonly<Record<string, unknown>>>> {
    const res = await this.fetcher(context, signal);
    if (res.isSuccess) {
      this.currentFlags = { ...this.currentFlags, ...res.value };
      this.notifyListeners();
    }
    return res;
  }

  async refresh(signal?: AbortSignal): Promise<VKResult<void>> {
    const res = await this.fetchFlags(undefined, signal);
    if (res.isFailure) {
      return res as unknown as VKResult<void>;
    }
    return VKResult.success(undefined);
  }
}

export function createVKRemoteFeatureFlagProvider(
  options: VKRemoteFeatureFlagProviderOptions,
): VKRemoteFeatureFlagProvider {
  return new DefaultRemoteFeatureFlagProvider(options);
}
