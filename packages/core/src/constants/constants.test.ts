import { describe, it, expect } from 'vitest';
import { VKTimeouts } from './constants.constants.js';

describe('constants', () => {
  it('exports correct standard timeouts', () => {
    expect(VKTimeouts.DefaultMs).toBe(30000);
    expect(VKTimeouts.ShortMs).toBe(5000);
    expect(VKTimeouts.LongMs).toBe(60000);
  });
});
