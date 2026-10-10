import { describe, it, expectTypeOf } from 'vitest';
import type { VKPipelineStage, VKPipelineOptions } from './pipeline.types.js';
import { VKPipelineRunner } from './vk-pipeline-runner.js';
import type { VKResult } from '../result/index.js';

describe('pipeline type tests', () => {
  it('should enforce proper generic inference', () => {
    interface Context {
      userId: string;
    }

    type Stage = VKPipelineStage<Context, number>;
    expectTypeOf<Stage>().toMatchTypeOf<{
      execute: (ctx: Context, signal?: AbortSignal) => Promise<VKResult<number>>;
    }>();

    expectTypeOf(VKPipelineRunner.execute<Context, number>).toBeCallableWith(
      [] as Stage[],
      { userId: 'u1' },
      {} as VKPipelineOptions<Context, number>,
    );
  });
});
