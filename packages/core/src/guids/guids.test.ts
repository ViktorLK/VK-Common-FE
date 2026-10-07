import { describe, it, expect } from 'vitest';
import {
  createUuidV4,
  createUuidV7,
  isValidGuid,
  DefaultGuidGenerator,
  createVKGuidGenerator,
  defaultGuidGenerator,
} from './index.js';
import { VK_EMPTY_GUID, VK_GUID_REGEX } from './guids.constants.js';

describe('guids', () => {
  describe('createUuidV4', () => {
    it('should generate valid RFC 4122 v4 UUIDs', () => {
      const id = createUuidV4();
      expect(isValidGuid(id)).toBe(true);
      expect(VK_GUID_REGEX.test(id)).toBe(true);
      expect(id[14]).toBe('4'); // version 4
      expect(['8', '9', 'a', 'b']).toContain(id[19]?.toLowerCase()); // variant
    });
  });

  describe('createUuidV7', () => {
    it('should generate valid RFC 9562 v7 UUIDs', () => {
      const id = createUuidV7();
      expect(isValidGuid(id)).toBe(true);
      expect(VK_GUID_REGEX.test(id)).toBe(true);
      expect(id[14]).toBe('7'); // version 7
      expect(['8', '9', 'a', 'b']).toContain(id[19]?.toLowerCase()); // variant
    });

    it('should be chronologically ordered across time increments', () => {
      let mockTime = 1700000000000;
      const timeSource = () => {
        mockTime += 1000;
        return mockTime;
      };

      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        ids.push(createUuidV7(timeSource));
      }

      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    });

    it('should maintain monotonicity even when called multiple times at the same millisecond', () => {
      const fixedTime = 1700000000000;
      const ids: string[] = [];
      for (let i = 0; i < 20; i++) {
        ids.push(createUuidV7(() => fixedTime));
      }

      // Check all are unique
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);

      // Check lexicographical ordering
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    });
  });

  describe('isValidGuid', () => {
    it('should return true for valid GUID formats', () => {
      expect(isValidGuid(VK_EMPTY_GUID)).toBe(true);
      expect(isValidGuid(createUuidV4())).toBe(true);
      expect(isValidGuid(createUuidV7())).toBe(true);
    });

    it('should return false for invalid formats or non-strings', () => {
      expect(isValidGuid('invalid-guid')).toBe(false);
      expect(isValidGuid('')).toBe(false);
      expect(isValidGuid(null)).toBe(false);
      expect(isValidGuid(12345)).toBe(false);
      expect(isValidGuid('00000000-0000-0000-0000-00000000000z')).toBe(false);
    });
  });

  describe('DefaultGuidGenerator', () => {
    it('should default to v7 creation', () => {
      const gen = new DefaultGuidGenerator();
      const id = gen.create();
      expect(id[14]).toBe('7');
      expect(isValidGuid(id)).toBe(true);
    });

    it('should create v4 when specified', () => {
      const gen = createVKGuidGenerator({ type: 'v4' });
      const id = gen.create();
      expect(id[14]).toBe('4');
    });

    it('should provide default singleton', () => {
      expect(defaultGuidGenerator).toBeDefined();
      expect(isValidGuid(defaultGuidGenerator.create())).toBe(true);
    });
  });
});
