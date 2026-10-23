// [AP.02] [MB.03] Enterprise Authentication & Policy Authorization Provider
import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { VKResult } from '@vk-blocks/core';
import type { VKAuthUser, VKAuthTokens, VKAuthSession } from '../types/auth.js';
import { VKTokenManager } from '../token/vk-token-manager.js';
import { VKAuthorizationEngine, type AuthRequirement } from '../authorization/vk-authorization-engine.js';
import type { IVKOidcAdapter } from '../oidc/types.js';
import {
  VKAuthContext,
  useVKAuth,
  useVKPermission,
  usePermission,
  useVKRole,
  useRole,
  useVKOidc,
  type VKAuthContextValue,
} from './auth-context.js';

export interface VKAuthProviderProps {
  readonly children: ReactNode;
  readonly initialSession?: Partial<VKAuthSession>;
  readonly tokenManager?: VKTokenManager;
  readonly authorizationEngine?: VKAuthorizationEngine;
  readonly oidcAdapter?: IVKOidcAdapter;
  readonly onSessionExpired?: () => void;
}

/**
 * Enterprise Authentication & Policy Authorization Provider.
 * Holds active user session, token manager, and authorization engine.
 */
export function VKAuthProvider({
  children,
  initialSession,
  tokenManager: customTokenManager,
  authorizationEngine: customEngine,
  oidcAdapter,
  onSessionExpired,
}: VKAuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<VKAuthUser | null>(initialSession?.user ?? null);
  const [tokens, setTokens] = useState<VKAuthTokens | null>(initialSession?.tokens ?? null);

  const tokenManager = useMemo(() => {
    return (
      customTokenManager ??
      new VKTokenManager({
        initialTokens: initialSession?.tokens,
        onSessionExpired: () => {
          setUser(null);
          setTokens(null);
          onSessionExpired?.();
        },
      })
    );
  }, [customTokenManager, initialSession?.tokens, onSessionExpired]);

  const authorizationEngine = useMemo(() => {
    return customEngine ?? new VKAuthorizationEngine();
  }, [customEngine]);

  const login = (newTokens: VKAuthTokens, newUser: VKAuthUser) => {
    tokenManager.setTokens(newTokens);
    setTokens(newTokens);
    setUser(newUser);
  };

  const logout = () => {
    tokenManager.clearTokens();
    setTokens(null);
    setUser(null);
    onSessionExpired?.();
  };

  const refreshToken = async (): Promise<VKResult<VKAuthTokens>> => {
    const res = await tokenManager.refreshToken();
    if (res.isSuccess) {
      setTokens(res.value);
    }
    return res;
  };

  const contextValue: VKAuthContextValue = {
    user,
    tokens,
    isAuthenticated: Boolean(user && tokens?.accessToken),
    tokenManager,
    authorizationEngine,
    oidcAdapter,
    login,
    logout,
    refreshToken,
    hasRole: (role: string) => authorizationEngine.hasRole(user, role),
    hasPermission: (permission: string) => authorizationEngine.hasPermission(user, permission),
    authorizePolicy: (policyName: string, resource?: unknown) =>
      authorizationEngine.authorizePolicy(policyName, user, resource),
  };

  return <VKAuthContext.Provider value={contextValue}>{children}</VKAuthContext.Provider>;
}

export interface VKAuthorizeProps extends AuthRequirement {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly resource?: unknown;
}

/**
 * Declarative component that conditionally renders its children if user fulfills auth requirements.
 */
export function VKAuthorize({
  children,
  fallback = null,
  resource,
  ...requirement
}: VKAuthorizeProps): React.ReactElement | null {
  const { user, authorizationEngine } = useVKAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    authorizationEngine.evaluate(requirement, user, resource).then((result) => {
      if (active) {
        setAuthorized(result);
      }
    });
    return () => {
      active = false;
    };
  }, [user, authorizationEngine, JSON.stringify(requirement), resource]);

  if (authorized === null) {
    return null;
  }

  return authorized ? <>{children}</> : <>{fallback}</>;
}

// Re-export context hooks and value types
export {
  useVKAuth,
  useVKPermission,
  usePermission,
  useVKRole,
  useRole,
  useVKOidc,
  type VKAuthContextValue,
};
