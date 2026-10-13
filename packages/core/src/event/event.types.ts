// [MB.02] Typed Event Bus contracts
import type { VKDisposable } from '../disposable/disposable.types.js';

export type VKEventHandler<T = unknown> = (payload: T) => void;

export interface VKEventBusOptions {
  readonly onError?: (error: unknown, event: string) => void;
}

export interface VKEventBus<Events extends Record<string, unknown> = Record<string, unknown>> {
  readonly on: <K extends keyof Events & string>(
    event: K,
    handler: VKEventHandler<Events[K]>,
  ) => VKDisposable;
  readonly once: <K extends keyof Events & string>(
    event: K,
    handler: VKEventHandler<Events[K]>,
  ) => VKDisposable;
  readonly emit: <K extends keyof Events & string>(event: K, payload: Events[K]) => void;
  readonly off: <K extends keyof Events & string>(
    event: K,
    handler: VKEventHandler<Events[K]>,
  ) => void;
}

/**
 * Aliases conforming to VK prefix convention (Item 26).
 */
export type VKEventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> = VKEventBus<Events>;
export type VKEventEmitterOptions = VKEventBusOptions;

