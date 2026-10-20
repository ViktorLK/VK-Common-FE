// [FS-03] [BASE-01] Re-export typed boundary mapper contracts from @vk-blocks/core
export type { VKMapper } from '@vk-blocks/core';
export {
  createVKMapper,
  vkMapArray,
  vkMapPagedResult,
  vkMapCursorPagedResult,
  vkMapResult,
} from '@vk-blocks/core';
