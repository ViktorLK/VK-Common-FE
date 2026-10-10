// [OR.02 / CS.06 / AP.01] React Flight Serializability Check for Server Components (RSC)
import { VKResult } from '../result/vk-result.js';
import { VKError } from '../errors/vk-error.js';

export const VKFlightErrorCodes = {
  FlightUnserializable: 'Core.Serialization.FlightUnserializable',
} as const;

interface FlightCheckResult {
  readonly ok: boolean;
  readonly reason?: string;
  readonly path?: string;
}

const REACT_SERVER_REFERENCE = Symbol.for('react.server.reference');
const REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference');

function isTypedArray(val: unknown): boolean {
  return (
    val instanceof Uint8Array ||
    val instanceof Int8Array ||
    val instanceof Uint16Array ||
    val instanceof Int16Array ||
    val instanceof Uint32Array ||
    val instanceof Int32Array ||
    val instanceof Float32Array ||
    val instanceof Float64Array ||
    val instanceof BigInt64Array ||
    val instanceof BigUint64Array
  );
}

function checkFlight(val: unknown, path: string, seen: Set<object>): FlightCheckResult {
  if (val === null || val === undefined) {
    return { ok: true };
  }

  const type = typeof val;

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return { ok: true };
  }

  if (type === 'bigint') {
    return { ok: true };
  }

  if (type === 'symbol') {
    if (Symbol.keyFor(val as symbol) !== undefined) {
      return { ok: true };
    }
    return {
      ok: false,
      reason: `Unregistered Symbol at "${path}" cannot be serialized across React Flight boundary. Use Symbol.for() instead.`,
      path,
    };
  }

  if (type === 'function') {
    const fn = val as { $$typeof?: symbol };
    if (fn.$$typeof === REACT_SERVER_REFERENCE || fn.$$typeof === REACT_CLIENT_REFERENCE) {
      return { ok: true };
    }
    return {
      ok: false,
      reason: `Function at "${path}" cannot be passed across the React Flight boundary unless registered as a Server/Client reference.`,
      path,
    };
  }

  if (type === 'object') {
    const obj = val as object;

    if (seen.has(obj)) {
      return {
        ok: false,
        reason: `Circular reference detected at "${path}". Circular objects cannot be serialized across React Flight boundary.`,
        path,
      };
    }
    seen.add(obj);

    if (val instanceof Promise) {
      return { ok: true };
    }

    if (val instanceof Date) {
      if (Number.isNaN(val.getTime())) {
        return {
          ok: false,
          reason: `Invalid Date instance at "${path}".`,
          path,
        };
      }
      return { ok: true };
    }

    if (val instanceof RegExp) {
      return { ok: true };
    }

    if (val instanceof ArrayBuffer || isTypedArray(val)) {
      return { ok: true };
    }

    if (val instanceof Map) {
      let index = 0;
      for (const [k, v] of val.entries()) {
        const keyCheck = checkFlight(k, `${path}.<MapKey:${index}>`, seen);
        if (!keyCheck.ok) return keyCheck;
        const valCheck = checkFlight(v, `${path}.<MapVal:${index}>`, seen);
        if (!valCheck.ok) return valCheck;
        index++;
      }
      return { ok: true };
    }

    if (val instanceof Set) {
      let index = 0;
      for (const item of val.values()) {
        const itemCheck = checkFlight(item, `${path}.<Set:${index}>`, seen);
        if (!itemCheck.ok) return itemCheck;
        index++;
      }
      return { ok: true };
    }

    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const itemCheck = checkFlight(val[i], `${path}[${i}]`, seen);
        if (!itemCheck.ok) return itemCheck;
      }
      return { ok: true };
    }

    // Plain object validation: prototype must be Object.prototype or null
    const proto = Object.getPrototypeOf(val);
    if (proto !== Object.prototype && proto !== null) {
      const className = Object.prototype.toString.call(val).slice(8, -1);
      return {
        ok: false,
        reason: `Class instance "${className}" at "${path}" cannot be serialized. Only plain objects, primitives, and supported Flight types can be passed across the RSC boundary.`,
        path,
      };
    }

    const keys = Object.keys(val);
    for (const key of keys) {
      const childCheck = checkFlight(
        (val as Record<string, unknown>)[key],
        path ? `${path}.${key}` : key,
        seen,
      );
      if (!childCheck.ok) return childCheck;
    }

    return { ok: true };
  }

  return {
    ok: false,
    reason: `Unsupported value of type "${type}" at "${path}".`,
    path,
  };
}

/**
 * Validates whether a value is safely serializable across the React Flight boundary (RSC -> Client).
 */
export function isFlightSerializable(value: unknown): boolean {
  const seen = new Set<object>();
  return checkFlight(value, '$', seen).ok;
}

/**
 * Validates whether a value is safely serializable, returning a typed VKResult<true>.
 */
export function tryAssertFlightSerializable(value: unknown): VKResult<true> {
  const seen = new Set<object>();
  const check = checkFlight(value, '$', seen);
  if (!check.ok) {
    return VKResult.failure(
      VKError.validation(
        VKFlightErrorCodes.FlightUnserializable,
        check.reason ?? 'Value is not serializable across React Flight boundary.',
        { extensions: { path: check.path } },
      ),
    );
  }
  return VKResult.success(true);
}

/**
 * Asserts that a value is serializable across the React Flight boundary, throwing a typed VKError on failure.
 */
export function assertFlightSerializable(value: unknown): void {
  const result = tryAssertFlightSerializable(value);
  if (result.isFailure) {
    throw result.errors[0];
  }
}

export const vkIsFlightSerializable = isFlightSerializable;
export const vkAssertFlightSerializable = assertFlightSerializable;
export const vkTryAssertFlightSerializable = tryAssertFlightSerializable;
