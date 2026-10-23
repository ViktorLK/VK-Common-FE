// [BASE-01] Contract-First Micro-Frontend Lifecycle & Federation Specifications
// [ARCH-01] Strict Unidirectional Boundaries
// [CS.01] Result-wrapped lifecycle responses
import type { VKResult } from '../result/result.types.js';

export interface VKMicroAppProps {
  readonly name: string;
  readonly container: HTMLElement;
  readonly basename?: string;
  readonly customProps?: Readonly<Record<string, unknown>>;
}

export interface VKMicroAppContext {
  readonly hostApp: string;
  readonly hostVersion: string;
  readonly traceId?: string;
  readonly tenantId?: string;
  readonly locale?: string;
}

/**
 * Standard isomorphic micro-frontend application lifecycle contract.
 * Compatible with Module Federation 2.0, single-spa, and custom sandboxes.
 */
export interface VKMicroAppLifecycle {
  bootstrap(context?: VKMicroAppContext): Promise<VKResult<void>>;
  mount(props: VKMicroAppProps, context?: VKMicroAppContext): Promise<VKResult<void>>;
  unmount(props: VKMicroAppProps): Promise<VKResult<void>>;
  update?(props: Partial<VKMicroAppProps>): Promise<VKResult<void>>;
}

/**
 * Module Federation 2.0 shared dependency declaration item.
 */
export interface VKFederationSharedDependency {
  readonly singleton?: boolean;
  readonly requiredVersion?: string;
  readonly strictVersion?: boolean;
  readonly eager?: boolean;
  readonly version?: string;
}

/**
 * Module Federation 2.0 remote and expose contract model.
 */
export interface VKFederationContract {
  readonly name: string;
  readonly filename?: string;
  readonly exposes?: Readonly<Record<string, string>>;
  readonly remotes?: Readonly<Record<string, string>>;
  readonly shared?: Readonly<Record<string, VKFederationSharedDependency>>;
  readonly dts?: {
    readonly generateTypes?: boolean;
    readonly consumeTypes?: boolean;
    readonly typesFolder?: string;
  };
}
