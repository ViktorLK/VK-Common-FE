export interface VKAuthUser {
  readonly id: string;
  readonly username: string;
  readonly email?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly claims?: Readonly<Record<string, unknown>>;
}

export interface VKAuthTokens {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly idToken?: string;
  readonly expiresAt?: number; // UNIX timestamp in milliseconds
}

export interface VKAuthSession {
  readonly user: VKAuthUser | null;
  readonly tokens: VKAuthTokens | null;
  readonly isAuthenticated: boolean;
}

export type VKPolicyHandler<TResource = unknown> = (
  user: VKAuthUser,
  resource?: TResource,
) => boolean | Promise<boolean>;
