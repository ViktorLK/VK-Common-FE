import type { VKHttpClient, VKHttpClientConfig } from './vk-http-client.js';
import { DefaultHttpClient } from '../_internal/default-http-client.js';

export function createVKHttpClient(config: VKHttpClientConfig): VKHttpClient {
  return new DefaultHttpClient(config);
}
