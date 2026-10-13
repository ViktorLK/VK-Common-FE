import { describe, it, expect, vi } from 'vitest';
import { vkThrottle } from './vk-throttle.js';

describe('vkThrottle (Item 21 / CS.03)', () => {
  it('invokes on leading edge and throttles subsequent invocations', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const throttled = vkThrottle(spy, 100);

    throttled(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);

    throttled(2);
    throttled(3);
    expect(spy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(3);

    vi.useRealTimers();
  });

  it('supports cancellation via .cancel()', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const throttled = vkThrottle(spy, 100);

    throttled('first');
    expect(spy).toHaveBeenCalledTimes(1);

    throttled('second');
    expect(throttled.isPending()).toBe(true);

    throttled.cancel();
    expect(throttled.isPending()).toBe(false);

    vi.advanceTimersByTime(150);
    expect(spy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
