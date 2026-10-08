import { describe, it, expectTypeOf } from 'vitest';
import type {
  VKTenantId,
  VKUserId,
  VKCorrelationId,
  VKExecutionContext,
  VKAmbientContextAccessor,
} from './context.types.js';
import { createAmbientContext } from './create-ambient-context.js';

describe('context type tests', () => {
  it('should enforce strong types on coordinates', () => {
    expectTypeOf(createAmbientContext()).toMatchTypeOf<VKAmbientContextAccessor>();
    expectTypeOf<VKTenantId>().not.toBeString();
    expectTypeOf<VKUserId>().not.toBeString();
    expectTypeOf<VKCorrelationId>().not.toBeString();
    expectTypeOf<VKExecutionContext>().toMatchTypeOf<{
      tenantId?: VKTenantId;
      userId?: VKUserId;
      traceId?: string;
    }>();
  });
});
