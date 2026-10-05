import { describe, it, expect } from 'vitest';
import { noopLogger } from './noop-logger.js';

describe('noopLogger', () => {
  it('executes silently without errors', () => {
    expect(() => {
      noopLogger.info('test');
      noopLogger.error('test', {}, new Error('fail'));
      const child = noopLogger.child({ module: 'sub' });
      child.debug('sub-test');
    }).not.toThrow();
  });
});
