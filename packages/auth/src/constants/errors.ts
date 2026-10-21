// [CS.01] [AP.01] Centralized error codes for @vk-blocks/auth

/**
 * Standard hierarchical error codes for authentication and authorization.
 * Format: Auth.{Category}.{Reason}
 */
export const VKAuthErrorCodes = {
  // Token Lifecycle
  TokenNoRefreshToken: 'Auth.Token.NoRefreshToken',
  TokenNoRefreshHandler: 'Auth.Token.NoRefreshHandler',
  TokenRefreshFailed: 'Auth.Token.RefreshFailed',
  TokenSessionExpired: 'Auth.Token.SessionExpired',
  TokenRequestAborted: 'Auth.Token.RequestAborted',
  TokenUnauthorized: 'Auth.Token.Unauthorized',
  TokenEnclaveFailed: 'Auth.Token.EnclaveFailed',
  TokenCookieProbeFailed: 'Auth.Token.CookieProbeFailed',

  // OIDC & OAuth PKCE
  OidcNotConfigured: 'Auth.Oidc.NotConfigured',
  OidcCallbackFailed: 'Auth.Oidc.CallbackFailed',
  OidcSilentRenewFailed: 'Auth.Oidc.SilentRenewFailed',
  OidcInvalidState: 'Auth.Oidc.InvalidState',
  OidcUserNotFound: 'Auth.Oidc.UserNotFound',
  OidcDiscoveryFailed: 'Auth.Oidc.DiscoveryFailed',
  OidcPkceGenerationFailed: 'Auth.Oidc.PkceGenerationFailed',
  OidcTokenExchangeFailed: 'Auth.Oidc.TokenExchangeFailed',
  OidcDeepLinkInvalid: 'Auth.Oidc.DeepLinkInvalid',

  // Tenancy
  TenantMissingContext: 'Auth.Tenant.MissingContext',
  TenantInvalidTenantId: 'Auth.Tenant.InvalidTenantId',
  TenantSwitchFailed: 'Auth.Tenant.SwitchFailed',

  // Deep Linking & Return Pipeline
  DeepLinkInvalidFormat: 'Auth.DeepLink.InvalidFormat',
  DeepLinkUnsafeRedirect: 'Auth.DeepLink.UnsafeRedirect',
  DeepLinkExpired: 'Auth.DeepLink.Expired',
  DeepLinkStateCorrupted: 'Auth.DeepLink.StateCorrupted',

  // Tenant Route Mapping
  TenantRouteInvalidHost: 'Auth.TenantRoute.InvalidHost',
  TenantRouteMappingFailed: 'Auth.TenantRoute.MappingFailed',

  // Authorization & Policies
  PolicyNotRegistered: 'Auth.Policy.NotRegistered',
  PolicyEvaluationFailed: 'Auth.Policy.EvaluationFailed',
  AccessDenied: 'Auth.Authorization.AccessDenied',
} as const;

export type VKAuthErrorCode =
  (typeof VKAuthErrorCodes)[keyof typeof VKAuthErrorCodes];
