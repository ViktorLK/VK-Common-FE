import { describe, it, expect, vi } from 'vitest';
import { vkDebounce } from './vk-debounce.js';

describe('vkDebounce (Item 21 / CS.03)', () => {
  it('delays execution until wait time has elapsed', async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = vkDebounce(spy, 100);

    debounced('a');
    debounced('b');
    debounced('c');

    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('c');

    vi.useRealTimers();
  });

  it('supports cancellation via .cancel()', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = vkDebounce(spy, 100);

    debounced('test');
    expect(debounced.isPending()).toBe(true);

    debounced.cancel();
    expect(debounced.isPending()).toBe(false);

    vi.advanceTimersByTime(200);
    expect(spy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('flushes pending invocation via .flush()', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = vkDebounce(spy, 100);

    debounced('immediate');
    debounced.flush();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('immediate');

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('supports leading edge invocation', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = vkDebounce(spy, 100, { leading: true });

    debounced('first');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('first');

    debounced('second');
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith('second');

    vi.useRealTimers();
  });
});
