import { describe, it, expect } from 'vitest';
import { isRecord } from './is-record.js';

describe('isRecord', () => {
  it('identifies non-null non-array objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('str')).toBe(false);
  });
});
