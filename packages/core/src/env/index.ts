// [MB.02] Explicit barrel export
export {
  isBrowser,
  isServer,
  isTauri,
  isWorker,
  isEdge,
  isReactServer,
  getIsBrowser,
  getIsServer,
  getIsWorker,
  getIsTauri,
  getIsEdge,
  getIsReactServer,
} from './env.constants.js';
export {
  vkDetectEnv,
  type VKRuntimeEnv,
  type VKEnvGlobals,
} from './vk-detect-env.js';
export { createVKEnv } from './create-vk-env.js';
export { VKEnvErrorCodes } from './env.errors.js';

