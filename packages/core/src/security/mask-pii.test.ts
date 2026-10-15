import { describe, it, expect } from 'vitest';
import { maskString, maskEmail, maskPhone } from './mask-pii.js';

describe('maskPII', () => {
  describe('maskString', () => {
    it('should mask middle characters keeping specified start and end', () => {
      expect(maskString('1234567890', { keepStart: 2, keepEnd: 2 })).toBe('12******90');
      expect(maskString('secret', { keepStart: 1 })).toBe('s*****');
      expect(maskString('abc', { keepStart: 2, keepEnd: 2 })).toBe('***');
    });
  });

  describe('maskEmail', () => {
    it('should mask standard email addresses', () => {
      expect(maskEmail('johndoe@example.com')).toBe('j*****e@example.com');
      expect(maskEmail('a@b.com')).toBe('a*@b.com');
      expect(maskEmail('invalid')).toBe('********');
    });
  });

  describe('maskPhone', () => {
    it('should preserve last 4 digits of phone number', () => {
      expect(maskPhone('+1-555-123-4567')).toBe('***********4567');
      expect(maskPhone('123')).toBe('********');
    });
  });
});
