// [AP.02] [MB.03] Enterprise Micro-frontend Safe Multi-Tenant Provider & Hooks
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  IVKTenantContext,
  IVKTenantStore,
  VKTenantSwitchHandler,
} from './types.js';
import { getGlobalTenantStore } from './tenant-container.js';

export interface VKTenantContextValue {
  readonly activeTenant: IVKTenantContext | null;
  readonly tenantId: string | null;
  readonly isSwitching: boolean;
  readonly setTenant: (
    tenantOrId: IVKTenantContext | string | null,
  ) => Promise<void>;
  readonly store: IVKTenantStore;
}

const VKTenantContext = createContext<VKTenantContextValue | null>(null);

export interface VKTenantProviderProps {
  readonly children: ReactNode;
  readonly initialTenant?: IVKTenantContext | string | null;
  readonly store?: IVKTenantStore;
  readonly onTenantChange?: VKTenantSwitchHandler;
}

function normalizeTenant(input: IVKTenantContext | string | null | undefined): IVKTenantContext | null {
  if (!input) return null;
  if (typeof input === 'string') {
    return { tenantId: input };
  }
  return input;
}

/**
 * Global Safe Multi-Tenant Context Provider.
 * Integrates with singleton tenant store to synchronize tenant states across micro-frontends.
 */
export function VKTenantProvider({
  children,
  initialTenant,
  store: customStore,
  onTenantChange,
}: VKTenantProviderProps): React.ReactElement {
  const store = useMemo(() => customStore ?? getGlobalTenantStore(), [customStore]);

  const [activeTenant, setActiveTenantState] = useState<IVKTenantContext | null>(() => {
    const existing = store.getActiveTenant();
    if (existing) return existing;
    const initial = normalizeTenant(initialTenant);
    if (initial) {
      store.setActiveTenant(initial);
      return initial;
    }
    return null;
  });

  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Sync React state when the singleton store updates (e.g. from a peer micro-frontend app)
  useEffect(() => {
    const unsubscribe = store.subscribe((newTenant) => {
      setActiveTenantState(newTenant);
    });
    return unsubscribe;
  }, [store]);

  const setTenant = useCallback(
    async (tenantOrId: IVKTenantContext | string | null): Promise<void> => {
      const normalized = normalizeTenant(tenantOrId);
      const prev = store.getActiveTenant();

      if (prev?.tenantId === normalized?.tenantId) {
        return;
      }

      setIsSwitching(true);
      try {
        if (onTenantChange) {
          await onTenantChange(normalized, prev);
        }
        store.setActiveTenant(normalized);
        setActiveTenantState(normalized);
      } finally {
        setIsSwitching(false);
      }
    },
    [store, onTenantChange],
  );

  const contextValue: VKTenantContextValue = useMemo(
    () => ({
      activeTenant,
      tenantId: activeTenant?.tenantId ?? null,
      isSwitching,
      setTenant,
      store,
    }),
    [activeTenant, isSwitching, setTenant, store],
  );

  return <VKTenantContext.Provider value={contextValue}>{children}</VKTenantContext.Provider>;
}

/**
 * Hook to access active tenant state and switching actions.
 * Fails fast if used outside of <VKTenantProvider> per MB.03.
 */
export function useVKTenant(): VKTenantContextValue {
  const context = useContext(VKTenantContext);
  if (!context) {
    throw new Error('useVKTenant must be used within a <VKTenantProvider>.');
  }
  return context;
}

/**
 * Ergonomic alias for useVKTenant.
 */
export const useTenant = useVKTenant;

/**
 * Utility helper to attach standard x-tenant-id header to HTTP requests.
 */
export function attachTenantHeader(
  headers: Record<string, string> = {},
  tenantId?: string | null,
): Record<string, string> {
  if (tenantId) {
    return {
      ...headers,
      'x-tenant-id': tenantId,
    };
  }
  return headers;
}
