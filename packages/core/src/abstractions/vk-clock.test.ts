import { describe, it, expect } from 'vitest';
import { defaultClock, createSettableClock } from './vk-clock.js';

describe('VKClock / TestClock (Item 35 / FS-05)', () => {
  describe('defaultClock', () => {
    it('returns a Date object from now() and a valid epoch number from timestamp()', () => {
      const now = defaultClock.now();
      const ts = defaultClock.timestamp();

      expect(now).toBeInstanceOf(Date);
      expect(typeof ts).toBe('number');
      expect(Math.abs(now.getTime() - ts)).toBeLessThan(100);
    });
  });

  describe('createSettableClock', () => {
    it('initializes with a provided timestamp or Date', () => {
      const fixedEpoch = 1700000000000;
      const clock1 = createSettableClock(fixedEpoch);
      expect(clock1.timestamp()).toBe(fixedEpoch);
      expect(clock1.now().getTime()).toBe(fixedEpoch);

      const fixedDate = new Date('2025-01-01T00:00:00.000Z');
      const clock2 = createSettableClock(fixedDate);
      expect(clock2.timestamp()).toBe(fixedDate.getTime());
      expect(clock2.now().toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('advances time deterministically with advance()', () => {
      const clock = createSettableClock(1000);
      clock.advance(500);
      expect(clock.timestamp()).toBe(1500);
      expect(clock.now().getTime()).toBe(1500);

      clock.advance(250);
      expect(clock.timestamp()).toBe(1750);
    });

    it('sets time explicitly with setTime()', () => {
      const clock = createSettableClock(1000);
      clock.setTime(5000);
      expect(clock.timestamp()).toBe(5000);

      const newDate = new Date('2026-06-01T12:00:00.000Z');
      clock.setTime(newDate);
      expect(clock.now().toISOString()).toBe('2026-06-01T12:00:00.000Z');
      expect(clock.timestamp()).toBe(newDate.getTime());
    });
  });
});
