import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { isBrowser, isServer, isTauri, isWorker, createVKEnv, VKEnvErrorCodes } from './index.js';
import { VKError } from '../errors/vk-error.js';

describe('env', () => {
  it('detects node runtime as server', () => {
    expect(isServer).toBe(true);
    expect(isBrowser).toBe(false);
    expect(isTauri).toBe(false);
    expect(isWorker).toBe(false);
  });

  it('createVKEnv validates valid environment', () => {
    const schema = z.object({
      PORT: z.string().default('3000'),
      NODE_ENV: z.enum(['development', 'production', 'test']).default('test'),
    });

    const config = createVKEnv(schema, { PORT: '8080' });
    expect(config.PORT).toBe('8080');
    expect(config.NODE_ENV).toBe('test');
  });

  it('createVKEnv throws VKError on invalid schema', () => {
    const schema = z.object({
      API_KEY: z.string().min(10),
    });

    try {
      createVKEnv(schema, { API_KEY: 'short' });
      expect.unreachable('Should have thrown VKError');
    } catch (err) {
      expect(err).toBeInstanceOf(VKError);
      expect((err as VKError).code).toBe(VKEnvErrorCodes.Invalid);
    }
  });
});
