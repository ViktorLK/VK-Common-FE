// [BASE-01] [ARCH-09] [FS-07] Multi-Tenant Bi-directional Subdomain & Path Route Mapper

export interface VKTenantRouteMapperConfig {
  /**
   * Root or base domain of the application (e.g. 'example.com' or 'localhost:3000').
   */
  readonly baseDomain: string;

  /**
   * Routing representation strategy:
   *  - 'subdomain': https://{tenant}.example.com/...
   *  - 'path': https://example.com/{pathPrefix}/{tenant}/...
   *  - 'auto': Use subdomain in production domains, fallback to path in localhost/IPs.
   */
  readonly mode?: 'subdomain' | 'path' | 'auto';

  /**
   * Optional path segment prefix preceding tenantId in path mode (e.g. 't' or 'tenants' or empty string '').
   * Default: ''
   */
  readonly pathPrefix?: string;

  /**
   * Subdomain labels that must NOT be treated as tenant identifiers (e.g. ['www', 'api', 'app', 'auth', 'admin']).
   */
  readonly reservedSubdomains?: readonly string[];

  /**
   * Fallback tenant identifier if none is detected.
   */
  readonly defaultTenantId?: string;
}

export interface IVKTenantRouteMapper {
  /**
   * Extracts tenant ID from a full URL, hostname, or location object.
   */
  extractTenant(
    input: string | { readonly hostname: string; readonly pathname: string },
  ): string | null;

  /**
   * Builds an absolute or relative tenant URL adhering to configured or overridden mode.
   */
  buildTenantUrl(
    tenantId: string,
    path: string,
    options?: {
      readonly mode?: 'subdomain' | 'path';
      readonly origin?: string;
    },
  ): string;

  /**
   * Converts a URL between subdomain format and path-prefix format.
   */
  convertTenantUrl(url: string, targetMode: 'subdomain' | 'path'): string;

  /**
   * Strips tenant segment and path prefix from a pathname, returning extracted tenant and canonical path.
   */
  stripTenantFromPath(pathname: string): {
    readonly tenantId: string | null;
    readonly cleanPath: string;
  };
}

const DEFAULT_RESERVED_SUBDOMAINS: readonly string[] = Object.freeze([
  'www',
  'api',
  'app',
  'auth',
  'admin',
  'static',
  'cdn',
  'stage',
  'dev',
  'test',
]);

class VKTenantRouteMapper implements IVKTenantRouteMapper {
  private readonly baseDomain: string;
  private readonly configuredMode: 'subdomain' | 'path' | 'auto';
  private readonly pathPrefix: string;
  private readonly reservedSubdomains: Set<string>;
  private readonly defaultTenantId?: string;

  constructor(config: VKTenantRouteMapperConfig) {
    this.baseDomain = config.baseDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    this.configuredMode = config.mode ?? 'auto';
    this.pathPrefix = config.pathPrefix ? config.pathPrefix.replace(/^\/+|\/+$/g, '') : '';
    this.reservedSubdomains = new Set([
      ...DEFAULT_RESERVED_SUBDOMAINS,
      ...(config.reservedSubdomains ?? []).map((s) => s.toLowerCase()),
    ]);
    this.defaultTenantId = config.defaultTenantId;
  }

  private isLocalOrIp(hostname: string): boolean {
    return (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      /^127(?:\.[0-9]+){3}$/.test(hostname) ||
      /^\[?::1\]?$/.test(hostname)
    );
  }

  private getEffectiveMode(hostname?: string): 'subdomain' | 'path' {
    if (this.configuredMode !== 'auto') {
      return this.configuredMode;
    }
    if (hostname && this.isLocalOrIp(hostname)) {
      return 'path';
    }
    return 'subdomain';
  }

  extractTenant(
    input: string | { readonly hostname: string; readonly pathname: string },
  ): string | null {
    let hostname = '';
    let pathname = '';

    if (typeof input === 'string') {
      try {
        const dummyBase = 'https://dummy-base.org';
        const parsed = input.startsWith('http://') || input.startsWith('https://')
          ? new URL(input)
          : new URL(input.startsWith('/') ? input : `/${input}`, dummyBase);

        hostname = parsed.hostname !== 'dummy-base.org' ? parsed.hostname.toLowerCase() : '';
        pathname = parsed.pathname;
      } catch {
        pathname = input;
      }
    } else {
      hostname = input.hostname.toLowerCase();
      pathname = input.pathname;
    }

    // 1. Try subdomain extraction first if hostname matches baseDomain
    if (hostname && hostname.endsWith(this.baseDomain)) {
      const sub = hostname.slice(0, -(this.baseDomain.length)).replace(/\.$/, '');
      if (sub && !this.reservedSubdomains.has(sub) && !sub.includes('.')) {
        return sub;
      }
    }

    // 2. Try path prefix extraction
    const stripped = this.stripTenantFromPath(pathname);
    if (stripped.tenantId) {
      return stripped.tenantId;
    }

    return this.defaultTenantId ?? null;
  }

  stripTenantFromPath(pathname: string): {
    readonly tenantId: string | null;
    readonly cleanPath: string;
  } {
    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const segments = normalized.split('/').filter(Boolean);

    if (this.pathPrefix) {
      if (segments[0] === this.pathPrefix && segments.length >= 2) {
        const potentialTenant = segments[1];
        if (potentialTenant && !this.reservedSubdomains.has(potentialTenant)) {
          const rest = segments.slice(2).join('/');
          return {
            tenantId: potentialTenant,
            cleanPath: `/${rest}`,
          };
        }
      }
    } else if (segments.length >= 1) {
      const potentialTenant = segments[0];
      if (potentialTenant && !this.reservedSubdomains.has(potentialTenant)) {
        const rest = segments.slice(1).join('/');
        return {
          tenantId: potentialTenant,
          cleanPath: `/${rest}`,
        };
      }
    }

    return {
      tenantId: null,
      cleanPath: normalized,
    };
  }

  buildTenantUrl(
    tenantId: string,
    path: string,
    options?: {
      readonly mode?: 'subdomain' | 'path';
      readonly origin?: string;
    },
  ): string {
    const rawPath = path.startsWith('/') ? path : `/${path}`;
    const mode = options?.mode ?? this.getEffectiveMode();

    if (mode === 'subdomain') {
      const protocol = 'https:';
      const host = `${tenantId}.${this.baseDomain}`;
      return `${protocol}//${host}${rawPath}`;
    }

    // Path mode
    const prefixSegment = this.pathPrefix ? `/${this.pathPrefix}` : '';
    const fullPath = `${prefixSegment}/${tenantId}${rawPath}`;

    if (options?.origin) {
      const cleanOrigin = options.origin.replace(/\/+$/, '');
      return `${cleanOrigin}${fullPath}`;
    }

    return fullPath;
  }

  convertTenantUrl(url: string, targetMode: 'subdomain' | 'path'): string {
    try {
      const parsed = new URL(url);
      const tenant = this.extractTenant({
        hostname: parsed.hostname,
        pathname: parsed.pathname,
      });

      if (!tenant) {
        return url;
      }

      const stripped = this.stripTenantFromPath(parsed.pathname);
      const searchAndHash = `${parsed.search}${parsed.hash}`;
      const cleanPathWithQuery = `${stripped.cleanPath}${searchAndHash}`;

      if (targetMode === 'subdomain') {
        return `${parsed.protocol}//${tenant}.${this.baseDomain}${cleanPathWithQuery}`;
      }

      // Path mode
      const prefixSegment = this.pathPrefix ? `/${this.pathPrefix}` : '';
      const pathWithTenant = `${prefixSegment}/${tenant}${cleanPathWithQuery}`;
      return `${parsed.protocol}//${this.baseDomain}${pathWithTenant}`;
    } catch {
      return url;
    }
  }
}

/**
 * Factory creating an IVKTenantRouteMapper instance.
 */
export function createVKTenantRouteMapper(
  config: VKTenantRouteMapperConfig,
): IVKTenantRouteMapper {
  return new VKTenantRouteMapper(config);
}
