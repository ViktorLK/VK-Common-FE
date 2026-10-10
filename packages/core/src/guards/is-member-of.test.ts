import { describe, it, expect } from 'vitest';
import { isMemberOf } from './is-member-of.js';

describe('isMemberOf', () => {
  it('checks membership in const object', () => {
    const Status = { Active: 'ACTIVE', Inactive: 'INACTIVE' } as const;
    expect(isMemberOf(Status, 'ACTIVE')).toBe(true);
    expect(isMemberOf(Status, 'PENDING')).toBe(false);
  });
});
