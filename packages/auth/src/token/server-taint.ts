// [BASE-01] [FS-12] [OR.02]
// Server-side RSC Data Tainting utilities for Auth Tokens and Sessions (React 19 Server Components)
import { vkTaintSecret, vkTaintObject, vkTaintSession, isVKTainted } from '@vk-blocks/core';
import type { VKAuthTokens, VKAuthSession } from '../types/auth.js';

/**
 * Taints an authentication token bundle on the server.
 * Taints accessToken, refreshToken, and idToken as unique primitive values,
 * and taints the token container object reference.
 * Prevents leaking authentication credentials to Client Components across the RSC Flight serialization boundary.
 */
export function vkTaintAuthTokens(
  tokens: VKAuthTokens,
  customWarningMessage?: string,
): VKAuthTokens {
  if (!tokens) {
    return tokens;
  }

  const warning =
    customWarningMessage ??
    '[OR.02] Do not pass VKAuthTokens (containing accessToken/refreshToken) to Client Components.';

  // Taint unique secret values
  if (tokens.accessToken) {
    vkTaintSecret(tokens.accessToken, `${warning} [accessToken]`);
  }
  if (tokens.refreshToken) {
    vkTaintSecret(tokens.refreshToken, `${warning} [refreshToken]`);
  }
  if (tokens.idToken) {
    vkTaintSecret(tokens.idToken, `${warning} [idToken]`);
  }

  // Taint the object reference itself
  return vkTaintObject(tokens, warning);
}

/**
 * Taints an entire authentication session on the server.
 * Automatically taints contained tokens and the session object reference.
 */
export function vkTaintAuthSession(
  session: VKAuthSession,
  customWarningMessage?: string,
): VKAuthSession {
  if (!session) {
    return session;
  }

  const warning =
    customWarningMessage ??
    '[OR.02] Do not pass raw VKAuthSession (containing sensitive server credentials) directly to Client Components.';

  if (session.tokens) {
    vkTaintAuthTokens(session.tokens, warning);
  }

  return vkTaintSession(session, warning);
}

export { isVKTainted };
