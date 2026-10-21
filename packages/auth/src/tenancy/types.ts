// [BASE-01] [ARCH-09] [FS-07] Multi-Tenant Context & Store Contracts

/**
 * Global Symbol guaranteeing singleton container resolution across micro-frontend apps.
 */
export const VK_TENANT_CONTAINER_KEY = '__VK_BLOCKS_TENANT_CONTAINER__';

/**
 * Standard Tenant Context payload.
 */
export interface IVKTenantContext {
  /**
   * Primary identifier of the tenant.
   */
  readonly tenantId: string;

  /**
   * Human-readable name or code of the tenant.
   */
  readonly tenantName?: string;

  /**
   * Additional tenant-specific metadata or configurations.
   */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Event callback signature invoked when tenant switches.
 */
export type VKTenantSwitchHandler = (
  newTenant: IVKTenantContext | null,
  previousTenant: IVKTenantContext | null,
) => void | Promise<void>;

/**
 * Micro-frontend safe singleton Tenant Store contract.
 */
export interface IVKTenantStore {
  /**
   * Returns currently active tenant context, or null if unassigned.
   */
  getActiveTenant(): IVKTenantContext | null;

  /**
   * Updates active tenant context and notifies subscribers.
   */
  setActiveTenant(tenant: IVKTenantContext | null): void;

  /**
   * Subscribes to tenant switch events across micro-frontend boundaries.
   * Returns an unsubscribe disposal callback.
   */
  subscribe(listener: (tenant: IVKTenantContext | null) => void): () => void;
}
