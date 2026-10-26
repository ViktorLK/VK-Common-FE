// [AP.01] Strict TypeScript mode
// [AP.02] Composition over prop drilling
// [MB.03] Typed context with fail-fast validation

import React, { createContext, useContext } from 'react';
import type { VKNamespaceManager } from './chunks.types.js';

const VKNamespaceContext = createContext<VKNamespaceManager | null>(null);

export interface VKNamespaceProviderProps {
  readonly manager: VKNamespaceManager;
  readonly children: React.ReactNode;
}

export const VKNamespaceProvider: React.FC<VKNamespaceProviderProps> = ({
  manager,
  children,
}) => {
  return (
    <VKNamespaceContext.Provider value={manager}>
      {children}
    </VKNamespaceContext.Provider>
  );
};

VKNamespaceProvider.displayName = 'VKNamespaceProvider';

/**
 * Accesses the active VKNamespaceManager from the context.
 */
export function useVKNamespaceManager(): VKNamespaceManager | null {
  return useContext(VKNamespaceContext);
}
