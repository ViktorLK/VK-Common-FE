// [ARCH-09] Ambient Execution Context Accessor Implementation
// [CS.01] Predictable scope life-cycle via VKDisposable
import type { VKDisposable } from '../disposable/index.js';
import { toDisposable } from '../disposable/index.js';
import type {
  VKAmbientContextAccessor,
  VKExecutionContext,
} from './context.types.js';

export class AmbientContextAccessor implements VKAmbientContextAccessor {
  private readonly stack: VKExecutionContext[] = [];

  get currentContext(): VKExecutionContext | undefined {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined;
  }

  beginScope(context: Partial<VKExecutionContext>): VKDisposable {
    const parent = this.currentContext;

    const merged: VKExecutionContext = {
      tenantId: context.tenantId ?? parent?.tenantId,
      userId: context.userId ?? parent?.userId,
      traceId: context.traceId ?? parent?.traceId,
      correlationId: context.correlationId ?? parent?.correlationId,
      locale: context.locale ?? parent?.locale,
      slots: {
        ...(parent?.slots ?? {}),
        ...(context.slots ?? {}),
      },
    };

    this.stack.push(merged);
    let disposed = false;

    return toDisposable(() => {
      if (disposed) return;
      disposed = true;

      // Pop scope if it's top of stack, or remove specific scope entry
      const index = this.stack.lastIndexOf(merged);
      if (index !== -1) {
        this.stack.splice(index, 1);
      }
    });
  }

  withScope<T>(context: Partial<VKExecutionContext>, fn: () => T): T {
    const scope = this.beginScope(context);
    try {
      return fn();
    } finally {
      scope.dispose();
    }
  }

  async withScopeAsync<T>(
    context: Partial<VKExecutionContext>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const scope = this.beginScope(context);
    try {
      return await fn();
    } finally {
      scope.dispose();
    }
  }

  clear(): void {
    this.stack.length = 0;
  }
}

export function createAmbientContext(): VKAmbientContextAccessor {
  return new AmbientContextAccessor();
}
