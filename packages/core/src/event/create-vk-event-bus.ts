// [MB.02] Typed Event Bus factory implementation
import type { VKDisposable } from '../disposable/disposable.types.js';
import type { VKEventBus, VKEventBusOptions, VKEventHandler } from './event.types.js';

export function createVKEventBus<
  Events extends Record<string, unknown> = Record<string, unknown>,
>(options?: VKEventBusOptions): VKEventBus<Events> {
  const listeners = new Map<string, Set<VKEventHandler<any>>>();

  const off = <K extends keyof Events & string>(
    event: K,
    handler: VKEventHandler<Events[K]>,
  ): void => {
    const set = listeners.get(event);
    if (set) {
      set.delete(handler as VKEventHandler<any>);
      if (set.size === 0) {
        listeners.delete(event);
      }
    }
  };

  const on = <K extends keyof Events & string>(
    event: K,
    handler: VKEventHandler<Events[K]>,
  ): VKDisposable => {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    set.add(handler as VKEventHandler<any>);
    return {
      dispose: () => off(event, handler),
    };
  };

  const once = <K extends keyof Events & string>(
    event: K,
    handler: VKEventHandler<Events[K]>,
  ): VKDisposable => {
    let disposable: VKDisposable;
    const wrapper = (payload: Events[K]) => {
      handler(payload);
      disposable.dispose();
    };
    disposable = on(event, wrapper as VKEventHandler<Events[K]>);
    return disposable;
  };

  const emit = <K extends keyof Events & string>(event: K, payload: Events[K]): void => {
    const set = listeners.get(event);
    if (set) {
      for (const handler of Array.from(set)) {
        try {
          handler(payload);
        } catch (e: unknown) {
          if (options?.onError) {
            options.onError(e, event);
          }
        }
      }
    }
  };

  return {
    on,
    once,
    emit,
    off,
  };
}

/**
 * Alias conforming to VK prefix convention (Item 26).
 */
export const createVKEventEmitter = createVKEventBus;

