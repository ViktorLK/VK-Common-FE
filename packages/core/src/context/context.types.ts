// [BASE-01] Contract-First: Ambient Execution Context Abstraction
// [FS-04] Strongly typed branded identifiers
// [ARCH-09] Boundary-Established Context
import type { VKTenantId, VKUserId, VKCorrelationId } from '../types/index.js';
import type { VKDisposable } from '../disposable/index.js';

export type { VKTenantId, VKUserId, VKCorrelationId };


export interface VKExecutionContext {
  readonly tenantId?: VKTenantId;
  readonly userId?: VKUserId;
  readonly traceId?: string;
  readonly correlationId?: VKCorrelationId;
  readonly locale?: string;
  readonly slots?: Readonly<Record<string, unknown>>;
}

export interface VKAmbientContextAccessor {
  /**
   * The current active execution context, or undefined if no context scope is active.
   */
  readonly currentContext: VKExecutionContext | undefined;

  /**
   * Pushes a new execution context scope onto the stack.
   * Merges with current context and restores the prior context upon disposing the returned token.
   */
  beginScope(context: Partial<VKExecutionContext>): VKDisposable;

  /**
   * Executes a synchronous callback within a scoped execution context.
   */
  withScope<T>(context: Partial<VKExecutionContext>, fn: () => T): T;

  /**
   * Executes an asynchronous callback within a scoped execution context.
   */
  withScopeAsync<T>(context: Partial<VKExecutionContext>, fn: () => Promise<T>): Promise<T>;

  /**
   * Clears the context stack back to empty.
   */
  clear(): void;
}
