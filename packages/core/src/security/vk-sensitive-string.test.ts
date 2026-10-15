import { describe, it, expect } from 'vitest';
import { VKSensitiveString } from './vk-sensitive-string.js';

describe('VKSensitiveString', () => {
  it('should mask value when stringified or logged', () => {
    const secret = new VKSensitiveString('my-super-secret-api-key');

    expect(secret.toString()).toBe('********');
    expect(`${secret}`).toBe('********');
    expect(secret.toJSON()).toBe('********');
    expect(JSON.stringify({ apiKey: secret })).toBe('{"apiKey":"********"}');
  });

  it('should reveal raw secret only when reveal() is explicitly called', () => {
    const raw = 'sk_live_1234567890';
    const secret = VKSensitiveString.from(raw);

    expect(secret.reveal()).toBe(raw);
  });

  it('should report isEmpty properly', () => {
    expect(new VKSensitiveString('').isEmpty).toBe(true);
    expect(new VKSensitiveString('token').isEmpty).toBe(false);
  });
});
