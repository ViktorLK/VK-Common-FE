// [MB.02] Explicit barrel export for GUID slice
export type { VKGuidGenerator, VKGuidOptions, VKGuidType } from './guids.types.js';
export { VK_EMPTY_GUID, VK_GUID_REGEX, VK_DEFAULT_GUID_TYPE } from './guids.constants.js';
export { VKGuidErrorCodes } from './guids.errors.js';
export { createUuidV4 } from './create-uuid-v4.js';
export { createUuidV7 } from './create-uuid-v7.js';
export { isValidGuid } from './is-valid-guid.js';
export { vkParseGuid } from './vk-parse-guid.js';

export {
  DefaultGuidGenerator,
  createVKGuidGenerator,
  defaultGuidGenerator,
} from './default-guid-generator.js';
