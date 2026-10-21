// [BASE-02] [ARCH-09] [FS-07] Micro-frontend Safe Singleton Tenant Container
import {
  VK_TENANT_CONTAINER_KEY,
  type IVKTenantContext,
  type IVKTenantStore,
} from './types.js';

class VKGlobalTenantStore implements IVKTenantStore {
  private currentTenant: IVKTenantContext | null = null;
  private readonly listeners = new Set<(tenant: IVKTenantContext | null) => void>();

  getActiveTenant(): IVKTenantContext | null {
    return this.currentTenant;
  }

  setActiveTenant(tenant: IVKTenantContext | null): void {
    if (this.currentTenant?.tenantId === tenant?.tenantId) {
      return;
    }
    this.currentTenant = tenant ? Object.freeze({ ...tenant }) : null;
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentTenant);
      } catch (err) {
        // Prevent listener errors from corrupting state propagation
      }
    });
  }

  subscribe(listener: (tenant: IVKTenantContext | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/**
 * Retrieves or initializes the global singleton tenant store on globalThis.
 * Ensures cross-micro-frontend boundaries share a unified active tenant state.
 */
export function getGlobalTenantStore(): IVKTenantStore {
  const globalRef = globalThis as unknown as Record<string, unknown>;
  const symbolKey = Symbol.for(VK_TENANT_CONTAINER_KEY);

  if (!globalRef[symbolKey as unknown as string]) {
    globalRef[symbolKey as unknown as string] = new VKGlobalTenantStore();
  }

  return globalRef[symbolKey as unknown as string] as IVKTenantStore;
}

/**
 * Creates an independent isolated tenant store (useful for server-side rendering or isolated testing).
 */
export function createTenantStore(initialTenant?: IVKTenantContext | null): IVKTenantStore {
  const store = new VKGlobalTenantStore();
  if (initialTenant) {
    store.setActiveTenant(initialTenant);
  }
  return store;
}
