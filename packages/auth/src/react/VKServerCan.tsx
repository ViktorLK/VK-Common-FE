// [AP.02] [OR.02] React Server Component (RSC) Declarative Permission Pruner
import React, { type ReactNode } from 'react';
import type { IVKAbility } from '../authorization/ability.js';
import type { VKAuthUser } from '../types/auth.js';

export interface VKServerCanProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;

  /**
   * Action string per CASL convention (e.g. 'read', 'delete', 'admin').
   * Alias for `do`.
   */
  readonly I?: string;
  readonly do?: string;

  /**
   * Target subject or resource entity per CASL convention.
   * Alias for `on`.
   */
  readonly a?: unknown;
  readonly on?: unknown;

  /**
   * Pre-computed or injected server-side ability instance.
   */
  readonly ability?: IVKAbility<any, any>;

  /**
   * Server-side user context.
   */
  readonly user?: VKAuthUser | null;

  /**
   * Direct role check.
   */
  readonly role?: string;
  readonly roles?: readonly string[];

  /**
   * Direct permission check.
   */
  readonly permission?: string;
  readonly permissions?: readonly string[];

  /**
   * Custom server-side predicate (synchronous or asynchronous).
   */
  readonly pass?: () => boolean | Promise<boolean>;
}

/**
 * React Server Component (RSC) Permission Component.
 * Runs strictly on the server during React Flight tree generation.
 * If unauthorized, the unauthorized children branch is NEVER serialized or transmitted
 * across the network, achieving complete server-side build tree pruning and zero client JS overhead.
 */
export async function VKServerCan({
  children,
  fallback = null,
  I,
  do: actionProp,
  a,
  on: resourceProp,
  ability,
  user,
  role,
  roles,
  permission,
  permissions,
  pass,
}: VKServerCanProps): Promise<React.ReactElement | null> {
  // 1. Custom predicate evaluation
  if (pass) {
    const passed = await pass();
    return passed ? <>{children}</> : <>{fallback}</>;
  }

  // 2. Role checks
  if (role) {
    if (!user || !user.roles.includes(role)) {
      return <>{fallback}</>;
    }
  }
  if (roles && roles.length > 0) {
    if (!user || !roles.every((r) => user.roles.includes(r))) {
      return <>{fallback}</>;
    }
  }

  // 3. Permission checks
  if (permission) {
    if (!user || !user.permissions.includes(permission)) {
      return <>{fallback}</>;
    }
  }
  if (permissions && permissions.length > 0) {
    if (!user || !permissions.every((p) => user.permissions.includes(p))) {
      return <>{fallback}</>;
    }
  }

  // 4. Ability evaluation (CASL / ABAC)
  const action = I ?? actionProp;
  const subject = a !== undefined ? a : resourceProp;

  if (action) {
    if (ability) {
      const allowed = ability.can(action, subject ?? 'all');
      if (!allowed) {
        return <>{fallback}</>;
      }
    } else if (user) {
      if (!user.permissions.includes(action)) {
        return <>{fallback}</>;
      }
    } else {
      return <>{fallback}</>;
    }
  }

  // Fully authorized: render children branch
  return <>{children}</>;
}

/**
 * Ergonomic alias for VKServerCan.
 */
export const ServerCan = VKServerCan;
