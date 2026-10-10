import { describe, it, expect } from 'vitest';
import { safeJsonStringify } from './safe-json-stringify.js';

describe('safeJsonStringify', () => {
  it('handles circular references gracefully without throwing', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj['self'] = obj;

    const json = safeJsonStringify(obj);
    expect(json).toContain('"self":"[Circular]"');
  });

  it('correctly serializes DAG (diamond / shared references) without false circular flag', () => {
    const shared = { x: 42 };
    const root = { first: shared, second: shared };

    const json = safeJsonStringify(root);
    expect(json).toBe('{"first":{"x":42},"second":{"x":42}}');
  });

  it('handles BigInt values', () => {
    const obj = { id: BigInt('9007199254740993') };
    const json = safeJsonStringify(obj);
    expect(json).toBe('{"id":"9007199254740993"}');
  });

  it('handles Error objects', () => {
    const err = new Error('Database connection failed');
    const json = safeJsonStringify({ error: err });
    expect(json).toContain('Database connection failed');
  });
});
