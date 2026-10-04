// [MB.02] Explicit barrel export
export type {
  VKIdGenerator,
  VKTimeProvider,
  VKSerializer,
  VKSerializerOptions,
} from './abstractions.types.js';
export { defaultIdGenerator } from './default-id-generator.js';
export { defaultTimeProvider } from './default-time-provider.js';
export { createVKSerializer } from './create-vk-serializer.js';
export { defaultSerializer } from './default-serializer.js';
