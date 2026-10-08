import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { resolveOptions } from './resolve-options.js';
import { VKOptionsErrorCodes } from './options.errors.js';
import { VKError } from '../errors/vk-error.js';

describe('resolveOptions', () => {
  const TestSchema = z.object({
    timeoutMs: z.number().min(100),
    retries: z.number().default(3),
    debug: z.boolean().default(false),
  });

  it('merges defaults with input and applies schema defaults', () => {
    const resolved = resolveOptions(
      TestSchema,
      { timeoutMs: 5000 },
      { debug: true },
    );

    expect(resolved.timeoutMs).toBe(5000);
    expect(resolved.retries).toBe(3);
    expect(resolved.debug).toBe(true);
  });

  it('throws VKError with VKOptionsErrorCodes.Invalid when validation fails', () => {
    try {
      resolveOptions(
        TestSchema,
        { timeoutMs: 5000 },
        { timeoutMs: 10 }, // Below min(100)
      );
      expect.fail('Should have thrown VKError');
    } catch (err) {
      expect(err).toBeInstanceOf(VKError);
      expect((err as VKError).code).toBe(VKOptionsErrorCodes.Invalid);
    }
  });
});
