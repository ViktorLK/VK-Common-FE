import { describe, it, expect } from 'vitest';
import { vkDetectEnv } from './vk-detect-env.js';

describe('vkDetectEnv (Item 37 / CS.07)', () => {
  it('detects server environment when window and self are undefined', () => {
    const env = vkDetectEnv({
      window: undefined,
      document: undefined,
      self: undefined,
    });

    expect(env.isServer).toBe(true);
    expect(env.isBrowser).toBe(false);
    expect(env.isWorker).toBe(false);
    expect(env.isTauri).toBe(false);
  });

  it('detects browser environment when window and document are defined', () => {
    const mockWindow = { document: {} };
    const env = vkDetectEnv({
      window: mockWindow,
      document: mockWindow.document,
    });

    expect(env.isBrowser).toBe(true);
    expect(env.isServer).toBe(false);
    expect(env.isWorker).toBe(false);
  });

  it('detects web worker environment', () => {
    const mockSelf = { importScripts: () => {} };
    const env = vkDetectEnv({
      window: undefined,
      document: undefined,
      self: mockSelf,
    });

    expect(env.isWorker).toBe(true);
    expect(env.isServer).toBe(false);
    expect(env.isBrowser).toBe(false);
  });

  it('detects Tauri desktop environment when Tauri internals exist', () => {
    const mockWindow = {
      document: {},
      __TAURI_INTERNALS__: {},
    };
    const env = vkDetectEnv({
      window: mockWindow,
      document: mockWindow.document,
    });

    expect(env.isBrowser).toBe(true);
    expect(env.isTauri).toBe(true);
  });
});
