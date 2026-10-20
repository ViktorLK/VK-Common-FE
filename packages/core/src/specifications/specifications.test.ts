import { describe, it, expect } from 'vitest';
import {
  createVKSpecification,
  VKSpecification,
  vkAllSpecification,
  vkNoneSpecification,
  VKAndSpecification,
  VKOrSpecification,
  VKNotSpecification,
} from './index.js';

interface User {
  id: string;
  age: number;
  isActive: boolean;
  role: 'admin' | 'user' | 'guest';
}

describe('specifications', () => {
  const isAdult = createVKSpecification<User>((u) => u.age >= 18);
  const isActive = createVKSpecification<User>((u) => u.isActive);
  const isAdmin = createVKSpecification<User>((u) => u.role === 'admin');

  const adultUser: User = { id: '1', age: 25, isActive: true, role: 'user' };
  const minorUser: User = { id: '2', age: 16, isActive: true, role: 'user' };
  const inactiveAdmin: User = { id: '3', age: 30, isActive: false, role: 'admin' };

  describe('basic specification', () => {
    it('should evaluate candidate with predicate', () => {
      expect(isAdult.isSatisfiedBy(adultUser)).toBe(true);
      expect(isAdult.isSatisfiedBy(minorUser)).toBe(false);
    });

    it('should support static factory methods', () => {
      expect(VKSpecification.from<User>((u) => u.age > 20).isSatisfiedBy(adultUser)).toBe(true);
      expect(vkAllSpecification<User>().isSatisfiedBy(minorUser)).toBe(true);
      expect(vkNoneSpecification<User>().isSatisfiedBy(adultUser)).toBe(false);
    });
  });

  describe('logical AND', () => {
    it('should combine specifications using and', () => {
      const activeAdult = isAdult.and(isActive);
      expect(activeAdult).toBeInstanceOf(VKAndSpecification);
      expect(activeAdult.isSatisfiedBy(adultUser)).toBe(true);
      expect(activeAdult.isSatisfiedBy(inactiveAdmin)).toBe(false);
      expect(activeAdult.isSatisfiedBy(minorUser)).toBe(false);
    });
  });

  describe('logical OR', () => {
    it('should combine specifications using or', () => {
      const adminOrAdult = isAdmin.or(isAdult);
      expect(adminOrAdult).toBeInstanceOf(VKOrSpecification);
      expect(adminOrAdult.isSatisfiedBy(adultUser)).toBe(true);
      expect(adminOrAdult.isSatisfiedBy(inactiveAdmin)).toBe(true);
      expect(adminOrAdult.isSatisfiedBy(minorUser)).toBe(false);
    });
  });

  describe('logical NOT', () => {
    it('should invert specification using not', () => {
      const notAdmin = isAdmin.not();
      expect(notAdmin).toBeInstanceOf(VKNotSpecification);
      expect(notAdmin.isSatisfiedBy(adultUser)).toBe(true);
      expect(notAdmin.isSatisfiedBy(inactiveAdmin)).toBe(false);

      // Double negation returns original inner specification
      const doubleNegated = notAdmin.not();
      expect(doubleNegated.isSatisfiedBy(inactiveAdmin)).toBe(true);
    });
  });

  describe('complex composition', () => {
    it('should support multi-level chained specifications', () => {
      // (Active AND Adult) OR Admin
      const spec = isActive.and(isAdult).or(isAdmin);

      expect(spec.isSatisfiedBy(adultUser)).toBe(true); // active adult
      expect(spec.isSatisfiedBy(inactiveAdmin)).toBe(true); // admin even though inactive
      expect(spec.isSatisfiedBy(minorUser)).toBe(false); // active but not adult and not admin
    });
  });
});
