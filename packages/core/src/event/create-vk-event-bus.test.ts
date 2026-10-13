import { describe, it, expect, vi } from 'vitest';
import { createVKEventBus } from './index.js';

interface AppEvents {
  'user:login': { userId: string };
  'user:logout': void;
}

describe('event', () => {
  it('typed event bus emits and receives events with typed payloads', () => {
    const bus = createVKEventBus<AppEvents>();
    const onLogin = vi.fn();

    const sub = bus.on('user:login', onLogin);
    bus.emit('user:login', { userId: 'u-123' });

    expect(onLogin).toHaveBeenCalledWith({ userId: 'u-123' });

    sub.dispose();
    bus.emit('user:login', { userId: 'u-456' });
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it('once subscribes only for a single dispatch', () => {
    const bus = createVKEventBus<AppEvents>();
    const onLogout = vi.fn();

    bus.once('user:logout', onLogout);
    bus.emit('user:logout', undefined as unknown as void);
    bus.emit('user:logout', undefined as unknown as void);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('handler errors are routed to onError and do not break other listeners', () => {
    const onError = vi.fn();
    const bus = createVKEventBus<AppEvents>({ onError });

    const badListener = vi.fn(() => {
      throw new Error('Listener failed');
    });
    const goodListener = vi.fn();

    bus.on('user:login', badListener);
    bus.on('user:login', goodListener);

    bus.emit('user:login', { userId: 'u-999' });

    expect(badListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
