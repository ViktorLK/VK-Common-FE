import { VKAuthUser, VKPolicyHandler } from '../types/auth.js';

export interface AuthRequirement {
  readonly role?: string;
  readonly roles?: readonly string[];
  readonly permission?: string;
  readonly permissions?: readonly string[];
  readonly policy?: string;
  readonly requireAll?: boolean; // If true, requires all roles/permissions; default is true for roles/permissions array
}

/**
 * Enterprise Policy-based Authorization Engine.
 * Supports granular role validation, composite permission checks, and dynamic entity policies.
 */
export class VKAuthorizationEngine {
  private readonly policies = new Map<string, VKPolicyHandler<any>>();

  /**
   * Registers a custom policy rule.
   * e.g. engine.registerPolicy('CanEditDocument', (user, doc) => user.id === doc.authorId || user.roles.includes('Admin'));
   */
  registerPolicy<TResource = unknown>(name: string, handler: VKPolicyHandler<TResource>): this {
    this.policies.set(name, handler as VKPolicyHandler<any>);
    return this;
  }

  hasRole(user: VKAuthUser | null, role: string): boolean {
    if (!user) return false;
    return user.roles.includes(role);
  }

  hasAnyRole(user: VKAuthUser | null, roles: readonly string[]): boolean {
    if (!user || roles.length === 0) return false;
    return roles.some((r) => user.roles.includes(r));
  }

  hasAllRoles(user: VKAuthUser | null, roles: readonly string[]): boolean {
    if (!user) return false;
    return roles.every((r) => user.roles.includes(r));
  }

  hasPermission(user: VKAuthUser | null, permission: string): boolean {
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  hasAnyPermission(user: VKAuthUser | null, permissions: readonly string[]): boolean {
    if (!user || permissions.length === 0) return false;
    return permissions.some((p) => user.permissions.includes(p));
  }

  hasAllPermissions(user: VKAuthUser | null, permissions: readonly string[]): boolean {
    if (!user) return false;
    return permissions.every((p) => user.permissions.includes(p));
  }

  /**
   * Evaluates a named policy against the given user and optional resource.
   */
  async authorizePolicy<TResource = unknown>(
    policyName: string,
    user: VKAuthUser | null,
    resource?: TResource,
  ): Promise<boolean> {
    if (!user) return false;
    const policy = this.policies.get(policyName);
    if (!policy) {
      console.warn(`[VKAuthorizationEngine] Policy '${policyName}' is not registered.`);
      return false;
    }
    return policy(user, resource);
  }

  /**
   * Unified requirement evaluator matching roles, permissions, or policies.
   */
  async evaluate(
    requirement: AuthRequirement,
    user: VKAuthUser | null,
    resource?: unknown,
  ): Promise<boolean> {
    if (!user) return false;

    // Single role check
    if (requirement.role && !this.hasRole(user, requirement.role)) {
      return false;
    }

    // Multiple roles check
    if (requirement.roles && requirement.roles.length > 0) {
      const passes = requirement.requireAll ?? true
        ? this.hasAllRoles(user, requirement.roles)
        : this.hasAnyRole(user, requirement.roles);
      if (!passes) return false;
    }

    // Single permission check
    if (requirement.permission && !this.hasPermission(user, requirement.permission)) {
      return false;
    }

    // Multiple permissions check
    if (requirement.permissions && requirement.permissions.length > 0) {
      const passes = requirement.requireAll ?? true
        ? this.hasAllPermissions(user, requirement.permissions)
        : this.hasAnyPermission(user, requirement.permissions);
      if (!passes) return false;
    }

    // Policy check
    if (requirement.policy) {
      const passes = await this.authorizePolicy(requirement.policy, user, resource);
      if (!passes) return false;
    }

    return true;
  }
}
