import { describe, it, expect } from 'vitest';
import { createAmbientContext } from './create-ambient-context.js';
import type { VKTenantId, VKUserId } from './context.types.js';

describe('AmbientContextAccessor', () => {

  it('should return undefined when no scope is pushed', () => {
    const ctx = createAmbientContext();
    expect(ctx.currentContext).toBeUndefined();
  });

  it('should push scope and restore previous state upon disposal', () => {
    const ctx = createAmbientContext();
    const tenantA = 'tenant-123' as VKTenantId;
    const userA = 'user-abc' as VKUserId;

    const scope1 = ctx.beginScope({ tenantId: tenantA });
    expect(ctx.currentContext?.tenantId).toBe(tenantA);
    expect(ctx.currentContext?.userId).toBeUndefined();

    const scope2 = ctx.beginScope({ userId: userA });
    expect(ctx.currentContext?.tenantId).toBe(tenantA);
    expect(ctx.currentContext?.userId).toBe(userA);

    scope2.dispose();
    expect(ctx.currentContext?.tenantId).toBe(tenantA);
    expect(ctx.currentContext?.userId).toBeUndefined();

    scope1.dispose();
    expect(ctx.currentContext).toBeUndefined();
  });

  it('should inherit and merge custom feature slots', () => {
    const ctx = createAmbientContext();
    const scope1 = ctx.beginScope({ slots: { theme: 'dark', featureA: true } });
    const scope2 = ctx.beginScope({ slots: { theme: 'light', featureB: 42 } });

    expect(ctx.currentContext?.slots).toEqual({
      theme: 'light',
      featureA: true,
      featureB: 42,
    });

    scope2.dispose();
    expect(ctx.currentContext?.slots).toEqual({
      theme: 'dark',
      featureA: true,
    });

    scope1.dispose();
    expect(ctx.currentContext).toBeUndefined();
  });

  it('should execute synchronously with withScope and auto-dispose', () => {
    const ctx = createAmbientContext();
    const tenantX = 't-x' as VKTenantId;

    const val = ctx.withScope({ tenantId: tenantX }, () => {
      expect(ctx.currentContext?.tenantId).toBe(tenantX);
      return 100;
    });

    expect(val).toBe(100);
    expect(ctx.currentContext).toBeUndefined();
  });

  it('should execute asynchronously with withScopeAsync and auto-dispose', async () => {
    const ctx = createAmbientContext();
    const tenantY = 't-y' as VKTenantId;

    const val = await ctx.withScopeAsync({ tenantId: tenantY }, async () => {
      expect(ctx.currentContext?.tenantId).toBe(tenantY);
      return 'async-done';
    });

    expect(val).toBe('async-done');
    expect(ctx.currentContext).toBeUndefined();
  });
});
