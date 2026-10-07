import { describe, it, expect } from 'vitest';
import { vkSafeJson, vkSafeJsonStringify } from './vk-safe-json.js';

describe('vkSafeJson (Item 42 / CS.06)', () => {
  it('safely serializes objects with circular references without throwing', () => {
    const circularObj: Record<string, unknown> = { name: 'test' };
    circularObj.self = circularObj;

    const json = vkSafeJson.stringify(circularObj);
    expect(json).toContain('"name":"test"');
    expect(json).toContain('"self":"[Circular]"');
  });

  it('safely serializes BigInt values', () => {
    const payload = { id: BigInt('9007199254740995') };
    const json = vkSafeJsonStringify(payload);
    expect(json).toContain('"id":"9007199254740995"');
  });

  it('safely parses JSON into typed objects', () => {
    const json = '{"count":42,"valid":true}';
    const parsed = vkSafeJson.parse<{ count: number; valid: boolean }>(json);
    expect(parsed.count).toBe(42);
    expect(parsed.valid).toBe(true);
  });
});
