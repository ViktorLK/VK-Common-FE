// [OR.01] Structured console logger implementation
import type { VKLogger, VKLogContext, VKLoggerConfig, VKLogLevel, VKLoggerSink } from '../logger.types.js';
import type { VKTimeProvider } from '../../abstractions/abstractions.types.js';
import { defaultTimeProvider } from '../../abstractions/default-time-provider.js';
import { safeJsonStringify } from '../../internal/serialization/safe-json-stringify.js';
import { redact } from '../redact.js';

const LogLevels: Record<VKLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class ConsoleLogger implements VKLogger {
  private readonly _levelName: VKLogLevel;
  private readonly _level: number;
  private readonly _isProduction: boolean;
  private readonly _timeProvider: VKTimeProvider;
  private readonly _sink?: VKLoggerSink;
  private readonly _parentContext: Partial<VKLogContext>;
  private readonly _redactKeys?: readonly string[];

  constructor(config?: VKLoggerConfig, parentContext: Partial<VKLogContext> = {}) {
    this._levelName = config?.level ?? 'info';
    this._level = LogLevels[this._levelName];
    this._isProduction = config?.isProduction ?? false;
    this._timeProvider = config?.timeProvider ?? defaultTimeProvider;
    this._sink = config?.sink;
    this._parentContext = parentContext;
    this._redactKeys = config?.redactKeys;
  }

  private _log(level: VKLogLevel, message: string, context?: Partial<VKLogContext>, error?: unknown) {
    if (LogLevels[level] < this._level) {
      return;
    }

    const mergedContext = {
      module: 'core',
      action: 'unspecified',
      ...this._parentContext,
      ...context,
    };

    const rawPayload = {
      level,
      timestamp: this._timeProvider.now().toISOString(),
      message,
      ...mergedContext,
      ...(error ? { error } : {}),
    };

    const payload = redact(rawPayload, this._redactKeys);

    if (this._sink) {
      this._sink(level, message, payload);
      return;
    }

    if (this._isProduction) {
      // Structured JSON logging in production
      // eslint-disable-next-line no-console
      console.log(safeJsonStringify(payload));
    } else {
      const prefix = `[${payload.timestamp}] [${level.toUpperCase()}] [${mergedContext.module}:${mergedContext.action}]`;
      const { module: _m, action: _a, ...restCtx } = mergedContext;

      switch (level) {
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(prefix, message, Object.keys(restCtx).length > 0 ? restCtx : '');
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.info(prefix, message, Object.keys(restCtx).length > 0 ? restCtx : '');
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(prefix, message, Object.keys(restCtx).length > 0 ? restCtx : '');
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error(prefix, message, Object.keys(restCtx).length > 0 ? restCtx : '', error ?? '');
          break;
      }
    }
  }

  debug(message: string, context?: Partial<VKLogContext>): void {
    this._log('debug', message, context);
  }

  info(message: string, context?: Partial<VKLogContext>): void {
    this._log('info', message, context);
  }

  warn(message: string, context?: Partial<VKLogContext>): void {
    this._log('warn', message, context);
  }

  error(message: string, context?: Partial<VKLogContext>, error?: unknown): void {
    this._log('error', message, context, error);
  }

  child(context: Partial<VKLogContext>): VKLogger {
    const nextContext = { ...this._parentContext, ...context };
    return new ConsoleLogger(
      {
        level: this._levelName,
        isProduction: this._isProduction,
        timeProvider: this._timeProvider,
        sink: this._sink,
        redactKeys: this._redactKeys,
      },
      nextContext,
    );
  }
}
