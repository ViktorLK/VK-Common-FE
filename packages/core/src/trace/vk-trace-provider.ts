import { VKIdGenerator } from '../abstractions/vk-id-generator.js';
import { defaultIdGenerator } from '../abstractions/vk-id-generator.js';

export interface VKTraceProvider {
  readonly getTraceId: () => string;
  readonly createChildId: (parentId: string) => string;
}

export function createVKTraceProvider(idGenerator?: VKIdGenerator): VKTraceProvider {
  const gen = idGenerator ?? defaultIdGenerator;

  return {
    getTraceId: () => gen.generate(),
    createChildId: (parentId) => `${parentId}.${gen.generate().slice(0, 8)}`,
  };
}
