import { describe, it, expect } from 'vitest';
import { vkDefineOptions, vkMergeOptions } from './options.js';
import type { VKOptionsValidator } from './options.types.js';
import { VKResult } from '../result/vk-result.js';
import { VKError } from '../errors/vk-error.js';
import { VKErrorCategory } from '../errors/errors.constants.js';

describe('vkDefineOptions and vkMergeOptions', () => {
  interface ServerConfig {
    readonly host: string;
    readonly port: number;
    readonly enableSsl: boolean;
  }

  const defaultServerConfig: ServerConfig = {
    host: 'localhost',
    port: 3000,
    enableSsl: false,
  };

  it('defines options and merges partial overrides without validator', () => {
    const definition = vkDefineOptions(defaultServerConfig);
    const result = vkMergeOptions(definition, { port: 8080 });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual({
        host: 'localhost',
        port: 8080,
        enableSsl: false,
      });
    }
  });

  it('uses default options when args are null or undefined', () => {
    const definition = vkDefineOptions(defaultServerConfig);
    const resultNull = vkMergeOptions(definition, null);
    const resultUndefined = vkMergeOptions(definition, undefined);

    expect(resultNull.isSuccess).toBe(true);
    if (resultNull.isSuccess) {
      expect(resultNull.value).toEqual(defaultServerConfig);
    }
    expect(resultUndefined.isSuccess).toBe(true);
    if (resultUndefined.isSuccess) {
      expect(resultUndefined.value).toEqual(defaultServerConfig);
    }
  });

  it('validates merged options using a VKOptionsValidator port', () => {
    const portValidator: VKOptionsValidator<ServerConfig> = {
      validate: (input: unknown): VKResult<ServerConfig> => {
        const candidate = input as ServerConfig;
        if (candidate.port <= 0 || candidate.port > 65535) {
          return VKResult.failure(
            VKError.validation('Config.Port.Invalid', 'Port must be between 1 and 65535', {
              category: VKErrorCategory.Validation,
              fieldErrors: [
                {
                  path: 'port',
                  code: 'Config.Port.OutOfRange',
                  message: 'Port must be between 1 and 65535',
                },
              ],
            }),
          );
        }
        return VKResult.success(candidate);
      },
    };

    const definition = vkDefineOptions(defaultServerConfig, portValidator);

    // Valid case
    const validResult = vkMergeOptions(definition, { port: 443, enableSsl: true });
    expect(validResult.isSuccess).toBe(true);
    if (validResult.isSuccess) {
      expect(validResult.value.port).toBe(443);
      expect(validResult.value.enableSsl).toBe(true);
    }

    // Invalid case
    const invalidResult = vkMergeOptions(definition, { port: 99999 });
    expect(invalidResult.isFailure).toBe(true);
    if (invalidResult.isFailure) {
      const err = invalidResult.errors[0];
      expect(err).toBeInstanceOf(VKError);
      expect(err.code).toBe('Config.Port.Invalid');
      expect(err.category).toBe(VKErrorCategory.Validation);
      expect(err.fieldErrors).toHaveLength(1);
      expect(err.fieldErrors?.[0].path).toBe('port');
    }
  });
});
