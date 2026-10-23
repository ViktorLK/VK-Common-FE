// [AP.02] [AP.03] [MB.06] Declarative ABAC & CASL Permission Component (<VKCan /> and <Can />)
import React, { ReactNode, useState, useEffect } from 'react';
import { useVKAuth } from './auth-context.js';
import type { IVKAbility } from '../authorization/ability.js';

export interface VKCanProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;

  /**
   * Action string per CASL convention (e.g. 'read', 'delete', 'update').
   * Alias for `do`.
   */
  readonly I?: string;

  /**
   * Target subject or resource entity per CASL convention (e.g. 'Invoice', or an invoice object).
   * Alias for `on`.
   */
  readonly a?: unknown;

  /**
   * Action or permission string to check (e.g. 'read', 'orders.delete').
   * Maps to permission check, or dynamic policy if `on` resource is provided.
   */
  readonly do?: string;

  /**
   * Target resource or contextual entity for ABAC policy evaluation.
   */
  readonly on?: unknown;

  /**
   * Explicit ability instance. If provided, used directly; otherwise uses authorizationEngine from context.
   */
  readonly ability?: IVKAbility<any, any>;

  /**
   * Render behavior when access is denied:
   * - 'hide': Renders fallback or null (default).
   * - 'disable': Clones single child element injecting disabled=true, aria-disabled=true, tabIndex=-1.
   */
  readonly behavior?: 'hide' | 'disable';

  /**
   * Explicit policy name registered in VKAuthorizationEngine.
   */
  readonly policy?: string;

  /**
   * Direct permission string check.
   */
  readonly permission?: string;

  /**
   * List of permissions.
   */
  readonly permissions?: readonly string[];

  /**
   * Direct role string check.
   */
  readonly role?: string;

  /**
   * List of roles.
   */
  readonly roles?: readonly string[];

  /**
   * Whether all roles/permissions in the list are required. Defaults to true.
   */
  readonly requireAll?: boolean;

  /**
   * Custom synchronous or asynchronous predicate function.
   */
  readonly pass?: (user: ReturnType<typeof useVKAuth>['user']) => boolean | Promise<boolean>;
}

/**
 * Enterprise Declarative ABAC & CASL Access Control Component.
 * Supports RBAC, PBAC (Policy-Based), and ABAC with 'hide' or 'disable' degradation behaviors.
 */
export function VKCan({
  children,
  fallback = null,
  I,
  a,
  do: actionProp,
  on: resourceProp,
  ability: customAbility,
  behavior = 'hide',
  policy: explicitPolicy,
  permission,
  permissions,
  role,
  roles,
  requireAll = true,
  pass,
}: VKCanProps): React.ReactElement | null {
  const { user, authorizationEngine } = useVKAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const action = I ?? actionProp;
  const resource = a !== undefined ? a : resourceProp;

  useEffect(() => {
    let active = true;

    async function evaluateAccess(): Promise<boolean> {
      if (!user) {
        return false;
      }

      // 1. Custom predicate evaluation
      if (pass) {
        return Boolean(await pass(user));
      }

      // 2. Direct Role check
      if (role && !authorizationEngine.hasRole(user, role)) {
        return false;
      }
      if (roles && roles.length > 0) {
        const rolePassed = requireAll
          ? authorizationEngine.hasAllRoles(user, roles)
          : authorizationEngine.hasAnyRole(user, roles);
        if (!rolePassed) return false;
      }

      // 3. Direct Permission check
      if (permission && !authorizationEngine.hasPermission(user, permission)) {
        return false;
      }
      if (permissions && permissions.length > 0) {
        const permPassed = requireAll
          ? authorizationEngine.hasAllPermissions(user, permissions)
          : authorizationEngine.hasAnyPermission(user, permissions);
        if (!permPassed) return false;
      }

      // 4. Ability evaluation (CASL style via customAbility or attached ability in engine)
      const effectiveAbility = customAbility ?? authorizationEngine.getAbility();
      if (effectiveAbility && action) {
        const allowed = effectiveAbility.can(action, resource ?? 'all');
        if (!allowed) {
          return false;
        }
      }

      // 5. ABAC Policy evaluation (Explicit policy or action + resource)
      const policyName = explicitPolicy ?? (action && resource !== undefined && !effectiveAbility ? action : undefined);
      if (policyName) {
        const policyPassed = await authorizationEngine.authorizePolicy(policyName, user, resource);
        if (!policyPassed) return false;
      } else if (action && !effectiveAbility) {
        // Fallback: action without resource evaluates as simple permission
        if (!authorizationEngine.hasPermission(user, action)) {
          return false;
        }
      }

      return true;
    }

    evaluateAccess()
      .then((res) => {
        if (active) setAuthorized(res);
      })
      .catch(() => {
        if (active) setAuthorized(false);
      });

    return () => {
      active = false;
    };
  }, [
    user,
    authorizationEngine,
    customAbility,
    action,
    resource,
    explicitPolicy,
    permission,
    JSON.stringify(permissions),
    role,
    JSON.stringify(roles),
    requireAll,
    pass,
  ]);

  if (authorized === null) {
    return null;
  }

  if (authorized) {
    return <>{children}</>;
  }

  // Unauthorized: handle 'disable' degradation or 'hide' fallback
  if (behavior === 'disable' && React.isValidElement(children)) {
    const existingProps = (children as React.ReactElement<Record<string, unknown>>).props || {};
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      'aria-disabled': 'true',
      tabIndex: -1,
      style: {
        ...(typeof existingProps.style === 'object' && existingProps.style !== null
          ? existingProps.style
          : {}),
        pointerEvents: 'none',
        opacity: 0.5,
      },
    });
  }

  return <>{fallback}</>;
}

/**
 * Ergonomic alias for VKCan component.
 */
export const Can = VKCan;
