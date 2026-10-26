// [MB.02] Explicit implementation - LocalStorage and Memory Cache Storage Adapters
// [AP.01] Modern TypeScript Semantics: Safe parsing, defensive error handling, zero any

import type {
  VKCachedBundle,
  VKCacheStorageAdapter,
} from './chunks.types.js';

export class VKMemoryCache implements VKCacheStorageAdapter {
  private readonly store = new Map<string, VKCachedBundle>();

  get(key: string): VKCachedBundle | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, data: VKCachedBundle): void {
    this.store.set(key, data);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export class VKLocalStorageCache implements VKCacheStorageAdapter {
  private readonly prefix: string;
  private readonly memoryFallback = new VKMemoryCache();

  constructor(prefix = 'vk-i18n-chunk:') {
    this.prefix = prefix;
  }

  private isStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  get(key: string): VKCachedBundle | null {
    if (!this.isStorageAvailable()) {
      return this.memoryFallback.get(key);
    }

    try {
      const fullKey = `${this.prefix}${key}`;
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<VKCachedBundle>;
      if (
        parsed &&
        typeof parsed === 'object' &&
        'data' in parsed &&
        typeof parsed.timestamp === 'number' &&
        typeof parsed.version === 'string'
      ) {
        return parsed as VKCachedBundle;
      }

      // Self-heal corrupted payload
      localStorage.removeItem(fullKey);
      return null;
    } catch {
      return this.memoryFallback.get(key);
    }
  }

  set(key: string, data: VKCachedBundle): void {
    if (!this.isStorageAvailable()) {
      this.memoryFallback.set(key, data);
      return;
    }

    try {
      const fullKey = `${this.prefix}${key}`;
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch {
      // Storage quota exceeded or disabled; fall back silently to in-memory
      this.memoryFallback.set(key, data);
    }
  }

  remove(key: string): void {
    if (!this.isStorageAvailable()) {
      this.memoryFallback.remove(key);
      return;
    }

    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch {
      this.memoryFallback.remove(key);
    }
  }

  clear(): void {
    this.memoryFallback.clear();
    if (!this.isStorageAvailable()) return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // Ignore storage enumeration failure
    }
  }
}
