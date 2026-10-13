import { describe, it, expect } from 'vitest';
import { createVKRetryPolicy } from './create-vk-retry-policy.js';

describe('createVKRetryPolicy', () => {
  it('executes retries according to policy options', async () => {
    const policy = createVKRetryPolicy({ maxRetries: 1 });
    let count = 0;
    const res = await policy.execute(async () => {
      count++;
      if (count === 1) throw new Error('Transient error');
      return 'done';
    });
    expect(res).toBe('done');
    expect(count).toBe(2);
  });
});
