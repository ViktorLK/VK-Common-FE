// [CS.07] Safe dynamic runtime environment detection pure function
export interface VKRuntimeEnv {
  readonly isBrowser: boolean;
  readonly isServer: boolean;
  readonly isWorker: boolean;
  readonly isTauri: boolean;
  readonly isEdge: boolean;
  readonly isReactServer: boolean;
}

export interface VKEnvGlobals {
  readonly window?: unknown;
  readonly document?: unknown;
  readonly self?: unknown;
  readonly process?: unknown;
  readonly EdgeRuntime?: unknown;
  readonly __REACT_SERVER__?: unknown;
}

/**
 * Pure function that detects the current execution runtime environment.
 * Evaluates globals only when invoked, and allows injecting mock globals for testing without side-effects.
 */
export function vkDetectEnv(globals?: VKEnvGlobals): VKRuntimeEnv {
  const win = globals !== undefined
    ? globals.window
    : typeof window !== 'undefined'
    ? window
    : undefined;

  const doc = globals !== undefined
    ? globals.document
    : typeof document !== 'undefined'
    ? document
    : (win as { document?: unknown } | undefined)?.document;

  const slf = globals !== undefined
    ? globals.self
    : typeof self !== 'undefined'
    ? self
    : undefined;

  const prc = globals !== undefined
    ? globals.process
    : typeof process !== 'undefined'
    ? process
    : undefined;

  const isBrowser = win !== undefined && doc !== undefined;
  const isWorker =
    !isBrowser &&
    typeof slf === 'object' &&
    slf !== null &&
    typeof (slf as { importScripts?: unknown }).importScripts === 'function';
  const isServer = !isBrowser && !isWorker;
  const isTauri =
    win !== undefined &&
    typeof win === 'object' &&
    win !== null &&
    ('__TAURI_INTERNALS__' in win || '__TAURI__' in win);

  const edge = globals !== undefined
    ? globals.EdgeRuntime
    : typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis
    ? (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime
    : undefined;

  const isEdge =
    typeof edge === 'string' ||
    (typeof prc === 'object' &&
      prc !== null &&
      (prc as { env?: Record<string, string | undefined> }).env?.NEXT_RUNTIME === 'edge');

  const rsc = globals !== undefined
    ? globals.__REACT_SERVER__
    : typeof globalThis !== 'undefined' && '__REACT_SERVER__' in globalThis
    ? (globalThis as { __REACT_SERVER__?: unknown }).__REACT_SERVER__
    : undefined;

  const isReactServer =
    rsc === true ||
    (typeof prc === 'object' &&
      prc !== null &&
      (prc as { env?: Record<string, string | undefined> }).env?.REACT_SERVER === 'true');

  return {
    isBrowser,
    isServer,
    isWorker,
    isTauri,
    isEdge,
    isReactServer,
  };
}
