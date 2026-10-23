// [MB.02] Explicit barrel export for Tenancy module
export type {
  IVKTenantContext,
  IVKTenantStore,
  VKTenantSwitchHandler,
} from './types.js';

export {
  VK_TENANT_CONTAINER_KEY,
} from './types.js';

export {
  getGlobalTenantStore,
  createTenantStore,
} from './tenant-container.js';

export {
  VKTenantProvider,
  useVKTenant,
  useTenant,
  attachTenantHeader,
  type VKTenantContextValue,
  type VKTenantProviderProps,
} from './VKTenantProvider.js';

export type {
  VKTenantRouteMapperConfig,
  IVKTenantRouteMapper,
} from './vk-tenant-route-mapper.js';

export {
  createVKTenantRouteMapper,
} from './vk-tenant-route-mapper.js';
