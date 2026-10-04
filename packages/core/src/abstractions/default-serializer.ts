// [CS.06] Default serializer instance
import { createVKSerializer } from './create-vk-serializer.js';
import type { VKSerializer } from './abstractions.types.js';

export const defaultSerializer: VKSerializer = createVKSerializer();
