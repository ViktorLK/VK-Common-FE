import { describe, it, expect } from 'vitest';
import { VKPipelineRunner } from './vk-pipeline-runner.js';
import type { VKPipelineStage, VKPipelineProgress } from './pipeline.types.js';
import { VKResult } from '../result/index.js';
import { VKError } from '../errors/index.js';
import { VKPipelineErrorCodes } from './pipeline.errors.js';

interface PipelineContext {
  logs: string[];
  counter: number;
}

describe('VKPipelineRunner', () => {
  it('should return defaultResult when stages list is empty', async () => {
    const context: PipelineContext = { logs: [], counter: 0 };
    const result = await VKPipelineRunner.execute([], context, { defaultResult: 42 });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(42);
  });

  it('should execute stages sequentially according to order', async () => {
    const context: PipelineContext = { logs: [], counter: 0 };

    const stageB: VKPipelineStage<PipelineContext, string> = {
      id: 'stage-b',
      schedule: { order: 20 },
      execute: async (ctx) => {
        ctx.logs.push('B');
        return VKResult.success('b-done');
      },
    };

    const stageA: VKPipelineStage<PipelineContext, string> = {
      id: 'stage-a',
      schedule: { order: 10 },
      execute: async (ctx) => {
        ctx.logs.push('A');
        return VKResult.success('a-done');
      },
    };

    const result = await VKPipelineRunner.execute([stageB, stageA], context);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe('b-done');
    expect(context.logs).toEqual(['A', 'B']);
  });

  it('should execute grouped stages concurrently', async () => {
    const context: PipelineContext = { logs: [], counter: 0 };

    const stage1: VKPipelineStage<PipelineContext, void> = {
      id: 'p1',
      schedule: { order: 10, parallelGroup: 'data' },
      execute: async (ctx) => {
        ctx.logs.push('P1');
        return VKResult.success();
      },
    };

    const stage2: VKPipelineStage<PipelineContext, void> = {
      id: 'p2',
      schedule: { order: 10, parallelGroup: 'data' },
      execute: async (ctx) => {
        ctx.logs.push('P2');
        return VKResult.success();
      },
    };

    const result = await VKPipelineRunner.execute([stage1, stage2], context);
    expect(result.isSuccess).toBe(true);
    expect(context.logs).toContain('P1');
    expect(context.logs).toContain('P2');
  });

  it('should report progress accurately', async () => {
    const context: PipelineContext = { logs: [], counter: 0 };
    const progressList: VKPipelineProgress<PipelineContext>[] = [];

    const stage1: VKPipelineStage<PipelineContext, void> = {
      id: 's1',
      schedule: { order: 1 },
      execute: async () => VKResult.success(),
    };
    const stage2: VKPipelineStage<PipelineContext, void> = {
      id: 's2',
      schedule: { order: 2 },
      execute: async () => VKResult.success(),
    };

    await VKPipelineRunner.execute([stage1, stage2], context, {
      onProgress: (p) => progressList.push(p),
    });

    expect(progressList).toHaveLength(2);
    expect(progressList[0]?.percentage).toBe(50);
    expect(progressList[1]?.percentage).toBe(100);
  });

  it('should halt and return failure when a stage fails', async () => {
    const context: PipelineContext = { logs: [], counter: 0 };

    const stage1: VKPipelineStage<PipelineContext, void> = {
      id: 's1',
      schedule: { order: 1 },
      execute: async () => VKResult.failure(VKError.failure('Err.Step1', 'Failed at step 1')),
    };
    const stage2: VKPipelineStage<PipelineContext, void> = {
      id: 's2',
      schedule: { order: 2 },
      execute: async (ctx) => {
        ctx.logs.push('should-not-run');
        return VKResult.success();
      },
    };

    const result = await VKPipelineRunner.execute([stage1, stage2], context);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0]?.code).toBe('Err.Step1');
    expect(context.logs).toHaveLength(0);
  });

  it('should short-circuit when condition is satisfied', async () => {
    const context: PipelineContext = { logs: [], counter: 0 };

    const stage1: VKPipelineStage<PipelineContext, string> = {
      id: 's1',
      schedule: { order: 1 },
      execute: async () => VKResult.success('cached-value'),
    };
    const stage2: VKPipelineStage<PipelineContext, string> = {
      id: 's2',
      schedule: { order: 2 },
      execute: async (ctx) => {
        ctx.logs.push('expensive-computation');
        return VKResult.success('computed-value');
      },
    };

    const result = await VKPipelineRunner.execute([stage1, stage2], context, {
      shouldShortCircuit: (res) => res === 'cached-value',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe('cached-value');
    expect(context.logs).toHaveLength(0);
  });

  it('should handle cancellation via AbortSignal', async () => {
    const context: PipelineContext = { logs: [], counter: 0 };
    const controller = new AbortController();
    controller.abort();

    const stage1: VKPipelineStage<PipelineContext, void> = {
      id: 's1',
      schedule: { order: 1 },
      execute: async () => VKResult.success(),
    };

    const result = await VKPipelineRunner.execute([stage1], context, {
      signal: controller.signal,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0]?.code).toBe(VKPipelineErrorCodes.Cancelled);
  });
});
