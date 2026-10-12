import { describe, it, expect } from 'vitest';
import {
  combineSignals,
  timeoutSignal,
  throwIfAborted,
} from './index.js';

describe('cancellation', () => {
  it('combineSignals triggers when any child signal aborts', () => {
    const c1 = new AbortController();
    const c2 = new AbortController();
    const combined = combineSignals(c1.signal, c2.signal);

    expect(combined.aborted).toBe(false);
    c1.abort('reason 1');
    expect(combined.aborted).toBe(true);
    expect(combined.reason).toBe('reason 1');
  });

  it('combineSignals handles already aborted signals', () => {
    const c1 = new AbortController();
    c1.abort('pre-aborted');
    const combined = combineSignals(c1.signal);
    expect(combined.aborted).toBe(true);
  });

  it('combineSignals handles single signal and empty list', () => {
    const emptySignal = combineSignals();
    expect(emptySignal.aborted).toBe(false);

    const c1 = new AbortController();
    const single = combineSignals(c1.signal);
    expect(single).toBe(c1.signal);
  });

  it('timeoutSignal aborts after delay', async () => {
    const sig = timeoutSignal(10);
    expect(sig.aborted).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    expect(sig.aborted).toBe(true);
  });

  it('throwIfAborted throws only when signal is aborted', () => {
    const c = new AbortController();
    expect(() => throwIfAborted(c.signal)).not.toThrow();

    c.abort('Cancelled');
    expect(() => throwIfAborted(c.signal)).toThrowError();
  });
});
