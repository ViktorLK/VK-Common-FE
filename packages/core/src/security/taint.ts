// [BASE-01] [BASE-02] [AP.01] [OR.02]
// RSC Data Tainting Contracts & Environment-Adaptive Engine for React 19 / Server Components
import { assertDefined, assertNotEmpty } from '../assert/vk-assert.js';

/**
 * Unique symbol used to mark tainted objects in isomorphic runtimes.
 */
export const VK_TAINTED_SYMBOL: unique symbol = Symbol.for('@vk-blocks/tainted');

/**
 * Contract for RSC Data Tainting providers.
 */
export interface IVKDataTainter {
  /**
   * Marks a unique primitive value (e.g. token, password, cryptographic secret) as tainted.
   * If this value is passed to a Client Component from a Server Component, an error is raised.
   */
  taintUniqueValue(
    warningMessage: string,
    lifetime: unknown,
    value: string | bigint | number,
  ): void;

  /**
   * Marks an object reference (e.g. session, internal credentials) as tainted.
   * If this object reference is passed to a Client Component from a Server Component, an error is raised.
   */
  taintObjectReference(
    warningMessage: string,
    object: object,
  ): void;
}

let cachedReactTaintFns: {
  taintUniqueValue?: (msg: string, lifetime: unknown, val: unknown) => void;
  taintObjectReference?: (msg: string, obj: object) => void;
} | null | undefined = undefined;

function resolveReactTaintFns(): {
  taintUniqueValue?: (msg: string, lifetime: unknown, val: unknown) => void;
  taintObjectReference?: (msg: string, obj: object) => void;
} | null {
  if (cachedReactTaintFns !== undefined) {
    return cachedReactTaintFns;
  }

  try {
    const g = globalThis as Record<string, unknown>;
    // Check if React is available on global scope or dynamic require in Node/RSC
    let reactObj = g.React as Record<string, unknown> | undefined;

    if (!reactObj && typeof globalThis !== 'undefined') {
      const maybeRequire = (globalThis as Record<string, unknown>)['require'] as
        | ((id: string) => Record<string, unknown>)
        | undefined;
      if (typeof maybeRequire === 'function') {
        try {
          const modName = ['rea', 'ct'].join('');
          reactObj = maybeRequire(modName);
        } catch {
          // Safe ignore
        }
      }
    }

    if (reactObj) {
      const uv = (reactObj.taintUniqueValue ?? reactObj.experimental_taintUniqueValue) as
        | ((msg: string, lifetime: unknown, val: unknown) => void)
        | undefined;
      const or = (reactObj.taintObjectReference ?? reactObj.experimental_taintObjectReference) as
        | ((msg: string, obj: object) => void)
        | undefined;

      if (typeof uv === 'function' || typeof or === 'function') {
        cachedReactTaintFns = {
          taintUniqueValue: uv,
          taintObjectReference: or,
        };
        return cachedReactTaintFns;
      }
    }
  } catch {
    // Ignore runtime lookup failures in pure client or restricted bundles
  }

  cachedReactTaintFns = null;
  return null;
}

/**
 * Fallback and isomorphic data tainter implementation.
 * Integrates with React 19 native taint APIs when available, and provides
 * non-enumerable symbol tagging and boundary assertion across all runtimes.
 */
export class VKDefaultDataTainter implements IVKDataTainter {
  private readonly taintedObjects = new WeakSet<object>();
  private readonly taintedValues = new Set<string | bigint | number>();

  public taintUniqueValue(
    warningMessage: string,
    lifetime: unknown,
    value: string | bigint | number,
  ): void {
    assertNotEmpty(warningMessage, 'Taint warning message must not be empty.');
    assertDefined(value, 'Taint value must be defined.');

    this.taintedValues.add(value);

    // Delegate to native React 19 RSC Taint API if present
    const native = resolveReactTaintFns();
    if (native?.taintUniqueValue) {
      native.taintUniqueValue(warningMessage, lifetime ?? value, value);
    }
  }

  public taintObjectReference(warningMessage: string, object: object): void {
    assertNotEmpty(warningMessage, 'Taint warning message must not be empty.');
    assertDefined(object, 'Taint object must be defined.');

    this.taintedObjects.add(object);

    // Attach non-enumerable symbol tag
    try {
      if (Object.isExtensible(object)) {
        Object.defineProperty(object, VK_TAINTED_SYMBOL, {
          value: warningMessage,
          configurable: true,
          enumerable: false,
          writable: false,
        });
      }
    } catch {
      // Ignored if object is frozen
    }

    // Delegate to native React 19 RSC Taint API if present
    const native = resolveReactTaintFns();
    if (native?.taintObjectReference) {
      native.taintObjectReference(warningMessage, object);
    }
  }

  public isTainted(target: unknown): boolean {
    if (target === null || target === undefined) {
      return false;
    }

    if (typeof target === 'object' || typeof target === 'function') {
      const obj = target as object;
      if (this.taintedObjects.has(obj)) {
        return true;
      }
      return (obj as Record<symbol, unknown>)[VK_TAINTED_SYMBOL] !== undefined;
    }

    if (
      typeof target === 'string' ||
      typeof target === 'number' ||
      typeof target === 'bigint'
    ) {
      return this.taintedValues.has(target);
    }

    return false;
  }
}

// [BASE-02] Injected singleton with default fallback
let currentDataTainter: IVKDataTainter = new VKDefaultDataTainter();

/**
 * Injects a custom or mock Data Tainter instance.
 */
export function setVKDataTainter(tainter: IVKDataTainter): void {
  assertDefined(tainter, 'Tainter must not be null or undefined.');
  currentDataTainter = tainter;
}

/**
 * Returns the currently active Data Tainter instance.
 */
export function getVKDataTainter(): IVKDataTainter {
  return currentDataTainter;
}

/**
 * Taints a sensitive primitive value (e.g. bearer token, secret key, credential string).
 * Prevents it from crossing the Server Component to Client Component Flight serialization boundary.
 */
export function vkTaintSecret(
  secret: string,
  warningMessage = 'Do not pass secret token or credential to Client Components.',
  lifetime?: unknown,
): void {
  if (!secret) return;
  currentDataTainter.taintUniqueValue(warningMessage, lifetime ?? secret, secret);
}

/**
 * Taints an object reference (e.g. server credentials, config, tenant secrets).
 * Prevents the object from being serialized down to Client Components.
 */
export function vkTaintObject<T extends object>(
  obj: T,
  warningMessage = 'Do not pass sensitive server object to Client Components.',
): T {
  if (obj === null || obj === undefined) return obj;
  currentDataTainter.taintObjectReference(warningMessage, obj);
  return obj;
}

/**
 * Taints a session object holding sensitive credentials.
 */
export function vkTaintSession<T extends object>(
  session: T,
  warningMessage = 'Do not pass raw server session object to Client Components.',
): T {
  return vkTaintObject(session, warningMessage);
}

/**
 * Verifies whether the specified value or object reference has been marked as tainted.
 */
export function isVKTainted(target: unknown): boolean {
  if (currentDataTainter instanceof VKDefaultDataTainter) {
    return currentDataTainter.isTainted(target);
  }

  if (target && (typeof target === 'object' || typeof target === 'function')) {
    return (target as Record<symbol, unknown>)[VK_TAINTED_SYMBOL] !== undefined;
  }

  return false;
}

/**
 * Boundary assertion guard. Throws an error if the payload contains tainted data.
 */
export function assertNotTainted(data: unknown, contextName = 'RSC boundary'): void {
  if (isVKTainted(data)) {
    throw new Error(
      `[OR.02] Security Violation: Attempted to expose tainted data [${contextName}] across a Client/Public boundary.`,
    );
  }
}
