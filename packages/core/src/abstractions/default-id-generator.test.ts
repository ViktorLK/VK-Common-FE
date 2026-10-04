import { describe, it, expect } from 'vitest';
import { defaultIdGenerator } from './default-id-generator.js';

describe('defaultIdGenerator', () => {
  it('generates non-empty unique string', () => {
    const id1 = defaultIdGenerator.generate();
    const id2 = defaultIdGenerator.generate();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});
