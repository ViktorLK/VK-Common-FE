// [AP.03] Default Guid Generator implementation adhering to VKGuidGenerator
import type { VKGuidGenerator, VKGuidOptions } from './guids.types.js';
import { createUuidV4 } from './create-uuid-v4.js';
import { createUuidV7 } from './create-uuid-v7.js';

export class DefaultGuidGenerator implements VKGuidGenerator {
  private readonly type: 'v4' | 'v7';
  private readonly timeSource?: () => number;

  constructor(options?: VKGuidOptions) {
    this.type = options?.type ?? 'v7';
    this.timeSource = options?.timeSource;
  }

  create(): string {
    return this.type === 'v7' ? this.createV7() : this.createV4();
  }

  createV4(): string {
    return createUuidV4();
  }

  createV7(): string {
    return createUuidV7(this.timeSource);
  }

  generate(): string {
    return this.create();
  }
}

export function createVKGuidGenerator(options?: VKGuidOptions): VKGuidGenerator {
  return new DefaultGuidGenerator(options);
}

export const defaultGuidGenerator: VKGuidGenerator = new DefaultGuidGenerator();
