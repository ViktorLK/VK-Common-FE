// [ARCH-05] Co-Located Defaults, Deterministic Overrides (Fallback & Provided tiers)
// [MB.03] Core Provider Registry implementation
import { VKError } from '../errors/index.js';
import { VKProviderErrorCodes } from './provider.errors.js';
import type {
  VKServiceToken,
  VKServiceLifetime,
  VKServiceFactory,
  VKServiceProvider,
  VKProviderRegistry,
} from './provider.types.js';
import type { VKDisposable } from '../disposable/index.js';

interface ServiceDescriptor {
  readonly name: string;
  readonly factory: VKServiceFactory<unknown>;
  readonly lifetime: VKServiceLifetime;
  readonly isProvided: boolean;
}

class ServiceProviderImpl implements VKServiceProvider, VKDisposable {
  private readonly instances = new Map<string, unknown>();
  private isDisposed = false;

  constructor(
    private readonly descriptors: ReadonlyMap<string, ServiceDescriptor>,
    private readonly parent?: ServiceProviderImpl,
  ) {}

  public get<T>(token: VKServiceToken<T>): T {
    const val = this.tryGet(token);
    if (val === undefined) {
      throw VKError.notFound(
        VKProviderErrorCodes.ServiceNotFound,
        `Service '${token.name}' is not registered in the provider registry.`,
      );
    }
    return val;
  }

  public tryGet<T>(token: VKServiceToken<T>): T | undefined {
    if (this.isDisposed) {
      throw VKError.failure(
        VKProviderErrorCodes.DisposedScope,
        'Cannot resolve services from a disposed scope.',
      );
    }

    const descriptor = this.descriptors.get(token.name);
    if (!descriptor) {
      return undefined;
    }

    if (descriptor.lifetime === 'transient') {
      return descriptor.factory(this) as T;
    }

    if (descriptor.lifetime === 'singleton') {
      // Singletons always reside in root
      if (this.parent) {
        return this.parent.tryGet(token);
      }
      if (!this.instances.has(token.name)) {
        this.instances.set(token.name, descriptor.factory(this));
      }
      return this.instances.get(token.name) as T;
    }

    // Scoped
    if (!this.instances.has(token.name)) {
      this.instances.set(token.name, descriptor.factory(this));
    }
    return this.instances.get(token.name) as T;
  }

  public createScope(): VKServiceProvider & VKDisposable {
    return new ServiceProviderImpl(this.descriptors, this);
  }

  public dispose(): void {
    if (!this.isDisposed) {
      this.instances.clear();
      this.isDisposed = true;
    }
  }
}

export class DefaultProviderRegistry implements VKProviderRegistry {
  private readonly descriptors = new Map<string, ServiceDescriptor>();

  public tryAddFallback<T>(
    token: VKServiceToken<T>,
    factory: VKServiceFactory<T>,
    lifetime: VKServiceLifetime = 'singleton',
  ): this {
    // If already registered by Provided tier or existing Fallback, do not overwrite (TryAdd semantics)
    if (this.descriptors.has(token.name)) {
      return this;
    }

    this.descriptors.set(token.name, {
      name: token.name,
      factory: factory as VKServiceFactory<unknown>,
      lifetime,
      isProvided: false,
    });
    return this;
  }

  public register<T>(
    token: VKServiceToken<T>,
    factory: VKServiceFactory<T>,
    lifetime: VKServiceLifetime = 'singleton',
  ): this {
    // Provided tier deterministically takes precedence over Fallback per ARCH-05
    this.descriptors.set(token.name, {
      name: token.name,
      factory: factory as VKServiceFactory<unknown>,
      lifetime,
      isProvided: true,
    });
    return this;
  }

  public build(): VKServiceProvider {
    return new ServiceProviderImpl(new Map(this.descriptors));
  }
}

/**
 * Creates a new Provider Registry builder instance adhering to ARCH-05.
 */
export function createVKProviderRegistry(): VKProviderRegistry {
  return new DefaultProviderRegistry();
}
