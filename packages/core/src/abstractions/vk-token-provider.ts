// [CS.01] & [CS.02] Typed Token Provider SPI for Transport and Auth Layers
import type { VKResult } from '../result/vk-result.js';

/**
 * Enterprise Token Provider Contract (SPI).
 * Enables dependency inversion for HTTP authentication, decoupling transport
 * and middleware layers from specific authentication engines or token managers.
 */
export interface VKTokenProvider {
  /**
   * Retrieves an active, refreshed Bearer access token.
   * @param signal Optional abort signal to cancel token acquisition or refresh.
   * @returns VKResult.success(token) when a valid access token is available.
   * @returns VKResult.success(null) when the user is in an unauthenticated or anonymous state.
   * @returns VKResult.failure(error) when token retrieval, network request, or refresh fails.
   */
  getAccessToken(signal?: AbortSignal): Promise<VKResult<string | null>>;

  /**
   * Invalidate cached token (e.g. on 401 response).
   */
  invalidateToken?(): Promise<void>;
}
