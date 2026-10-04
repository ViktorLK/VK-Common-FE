import { describe, it, expect } from 'vitest';
import { defaultSerializer } from './default-serializer.js';
import { createVKSerializer } from './create-vk-serializer.js';

describe('defaultSerializer & createVKSerializer', () => {
  it('defaultSerializer serializes and parses basic JSON', () => {
    const serialized = defaultSerializer.serialize({ name: 'test', value: 123 });
    const deserialized = defaultSerializer.deserialize<{ name: string; value: number }>(serialized);
    expect(deserialized.name).toBe('test');
    expect(deserialized.value).toBe(123);
  });

  it('createVKSerializer allows custom reviver and replacer', () => {
    const serializer = createVKSerializer({
      replacer: (key, val) => (key === 'secret' ? '***' : val),
    });
    const serialized = serializer.serialize({ secret: '12345', name: 'test' });
    expect(serialized).toContain('"secret":"***"');
  });

  it('createVKSerializer optionally revives ISO dates when configured', () => {
    const serializer = createVKSerializer({ reviveDates: true });
    const date = new Date('2026-10-04T12:00:00.000Z');
    const serialized = serializer.serialize({ createdAt: date });
    const deserialized = serializer.deserialize<{ createdAt: Date }>(serialized);
    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.createdAt.toISOString()).toBe(date.toISOString());
  });
});
