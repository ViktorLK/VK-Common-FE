// [OR.01] Structured logger implementation
// [CS.06] Deterministic timestamps via VKTimeProvider
// [CS.07] Safe environment check without raw process.env reliance
import { VKLogger, VKLogContext, VKLoggerConfig, VKLogLevel } from '../vk-logger.js';
import { defaultTimeProvider, VKTimeProvider } from '../../abstractions/vk-time-provider.js';

const LogLevels: Record<VKLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class ConsoleLogger implements VKLogger {
  private readonly _level: number;
  private readonly _isProduction: boolean;
  private readonly _timeProvider: VKTimeProvider;
  private readonly _sink?: (level: VKLogLevel, message: string, payload: Readonly<Record<string, unknown>>) => void;

  constructor(config?: VKLoggerConfig) {
    this._level = LogLevels[config?.level ?? 'info'];
    const envProd = typeof process !== 'undefined' && Boolean(process.env?.['NODE_ENV'] === 'production');
    this._isProduction = config?.isProduction ?? envProd;
    this._timeProvider = config?.timeProvider ?? defaultTimeProvider;
    this._sink = config?.sink;
  }

  private _log(level: VKLogLevel, message: string, context: VKLogContext, error?: unknown) {
    if (LogLevels[level] < this._level) {
      return;
    }

    const payload = {
      level,
      timestamp: this._timeProvider.toISO(this._timeProvider.now()),
      message,
      ...context,
      ...(error ? { error } : {}),
    };

    if (this._sink) {
      this._sink(level, message, payload);
      return;
    }

    if (this._isProduction) {
      // Structured JSON logging in production
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload));
    } else {
      // Pretty printing in development
      const prefix = `[${payload.timestamp}] [${level.toUpperCase()}] [${context.module}:${context.action}]`;
      const { module: _m, action: _a, ...restCtx } = context;

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

  debug(message: string, context: VKLogContext) {
    this._log('debug', message, context);
  }

  info(message: string, context: VKLogContext) {
    this._log('info', message, context);
  }

  warn(message: string, context: VKLogContext) {
    this._log('warn', message, context);
  }

  error(message: string, context: VKLogContext, error?: unknown) {
    this._log('error', message, context, error);
  }
}
