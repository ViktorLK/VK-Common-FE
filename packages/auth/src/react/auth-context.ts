// [MB.03] Typed Auth Context & Hooks isolating state from component hierarchy
import { createContext, useContext } from 'react';
import type { VKResult } from '@vk-blocks/core';
import type { VKAuthUser, VKAuthTokens, VKAuthSession } from '../types/auth.js';
import type { VKTokenManager } from '../token/vk-token-manager.js';
import type { VKAuthorizationEngine } from '../authorization/vk-authorization-engine.js';
import type { IVKOidcAdapter } from '../oidc/types.js';

export interface VKAuthContextValue extends VKAuthSession {
  readonly tokenManager: VKTokenManager;
  readonly authorizationEngine: VKAuthorizationEngine;
  readonly oidcAdapter?: IVKOidcAdapter;
  readonly login: (tokens: VKAuthTokens, user: VKAuthUser) => void;
  readonly logout: () => void;
  readonly refreshToken: () => Promise<VKResult<VKAuthTokens>>;
  readonly hasRole: (role: string) => boolean;
  readonly hasPermission: (permission: string) => boolean;
  readonly authorizePolicy: (policyName: string, resource?: unknown) => Promise<boolean>;
}

export const VKAuthContext = createContext<VKAuthContextValue | null>(null);

/**
 * Hook to access active auth session, user info, and token methods.
 * Fails fast with a helpful error message if used outside of VKAuthProvider (MB.03).
 */
export function useVKAuth(): VKAuthContextValue {
  const context = useContext(VKAuthContext);
  if (!context) {
    throw new Error('useVKAuth must be used within a <VKAuthProvider>.');
  }
  return context;
}

/**
 * Hook to access the configured OIDC adapter if provided.
 */
export function useVKOidc(): IVKOidcAdapter | undefined {
  const { oidcAdapter } = useVKAuth();
  return oidcAdapter;
}

/**
 * Hook to reactively check whether current user possesses a required permission.
 */
export function useVKPermission(permission: string): boolean {
  const { hasPermission } = useVKAuth();
  return hasPermission(permission);
}

/**
 * Ergonomic alias for useVKPermission.
 */
export const usePermission = useVKPermission;

/**
 * Hook to reactively check whether current user possesses a required role.
 */
export function useVKRole(role: string): boolean {
  const { hasRole } = useVKAuth();
  return hasRole(role);
}

/**
 * Ergonomic alias for useVKRole.
 */
export const useRole = useVKRole;
