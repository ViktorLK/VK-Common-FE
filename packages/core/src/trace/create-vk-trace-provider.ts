// [FS-11] Trace provider factory implementation
import type { VKIdGenerator, VKTimeProvider } from '../abstractions/abstractions.types.js';
import { defaultIdGenerator } from '../abstractions/default-id-generator.js';
import { defaultTimeProvider } from '../abstractions/default-time-provider.js';
import type { VKTraceProvider, VKSpan, VKTraceContext, VKTraceProviderOptions } from './trace.types.js';

export function createVKTraceProvider(options?: VKTraceProviderOptions | VKIdGenerator): VKTraceProvider {
  const isIdGen = options && typeof (options as VKIdGenerator).generate === 'function';
  const gen: VKIdGenerator = isIdGen
    ? (options as VKIdGenerator)
    : (options as VKTraceProviderOptions)?.idGenerator ?? defaultIdGenerator;
  const time: VKTimeProvider = (!isIdGen && (options as VKTraceProviderOptions)?.timeProvider)
    ? (options as VKTraceProviderOptions).timeProvider!
    : defaultTimeProvider;

  const createTraceId = () => gen.generate().replace(/-/g, '').padStart(32, '0').slice(0, 32);
  const createSpanId = () => gen.generate().replace(/-/g, '').padStart(16, '0').slice(0, 16);

  const startSpan = (name: string, parentContext?: Partial<VKTraceContext>): VKSpan => {
    const traceId = parentContext?.traceId ?? createTraceId();
    const spanId = createSpanId();
    const parentId = parentContext?.spanId ?? parentContext?.parentId;
    const startTime = time.timestamp();
    let ended = false;
    let finalDuration = 0;

    return {
      name,
      traceId,
      spanId,
      ...(parentId !== undefined ? { parentId } : {}),
      durationMs: () => (ended ? finalDuration : time.timestamp() - startTime),
      end: () => {
        if (!ended) {
          ended = true;
          finalDuration = time.timestamp() - startTime;
        }
        return finalDuration;
      },
    };
  };

  return {
    createTraceId,
    getTraceId: createTraceId,
    createSpanId,
    startSpan,
  };
}
