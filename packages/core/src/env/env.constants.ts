// [CS.07] Safe static runtime environment detection constants (No side-effects on import)

export const isBrowser: boolean =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const isWorker: boolean =
  typeof self === 'object' &&
  typeof (self as { importScripts?: unknown }).importScripts === 'function';

export const isServer: boolean = !isBrowser && !isWorker;

export const isTauri: boolean =
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
