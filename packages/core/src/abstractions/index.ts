// [MB.02] Explicit barrel export
export type {
  VKIdGenerator,
  VKClock,
  VKTimeProvider,
  VKSerializer,
  VKSerializerOptions,
} from './abstractions.types.js';
export { defaultIdGenerator } from './default-id-generator.js';
export { defaultTimeProvider } from './default-time-provider.js';
export { defaultClock, createSettableClock, type VKTestClock } from './vk-clock.js';
export { createVKSerializer } from './create-vk-serializer.js';
export { defaultSerializer } from './default-serializer.js';
export { vkSafeJson, vkSafeJsonStringify, type VKSafeJson } from './vk-safe-json.js';
export type { VKTokenProvider } from './vk-token-provider.js';


