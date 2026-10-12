// [OR.01] Structured console logger implementation
import type { VKLogger, VKLogContext, VKLoggerConfig, VKLogLevel, VKLoggerSink, VKLogMessage } from '../logger.types.js';
import type { VKTimeProvider } from '../../abstractions/abstractions.types.js';
import { defaultTimeProvider } from '../../abstractions/default-time-provider.js';
import { safeJsonStringify } from '../../internal/serialization/safe-json-stringify.js';
import { redact } from '../redact.js';

const LogLevels: Record<VKLogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

function compileNamespaceMatcher(namespaces?: string): ((name: string) => boolean) | undefined {
  if (!namespaces || namespaces.trim() === '') return undefined;
  if (namespaces.trim() === '*') return () => true;

  const rules = namespaces
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pattern) => {
      const isNegated = pattern.startsWith('-');
      const cleanPattern = isNegated ? pattern.slice(1) : pattern;
      const regexStr = cleanPattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexStr}$`);
      return { isNegated, regex };
    });

  return (name: string) => {
    let matched = false;
    for (const rule of rules) {
      if (rule.regex.test(name)) {
        if (rule.isNegated) return false;
        matched = true;
      }
    }
    return matched;
  };
}

export class ConsoleLogger implements VKLogger {
  private readonly _levelName: VKLogLevel;
  private readonly _level: number;
  private readonly _isProduction: boolean;
  private readonly _timeProvider: VKTimeProvider;
  private readonly _sink?: VKLoggerSink;
  private readonly _parentContext: Partial<VKLogContext>;
  private readonly _redactKeys?: readonly string[];
  private readonly _namespaces?: string;
  private readonly _namespaceMatcher?: (name: string) => boolean;

  constructor(config?: VKLoggerConfig, parentContext: Partial<VKLogContext> = {}) {
    this._levelName = config?.level ?? 'info';
    this._level = LogLevels[this._levelName];
    this._isProduction = config?.isProduction ?? false;
    this._timeProvider = config?.timeProvider ?? defaultTimeProvider;
    this._sink = config?.sink;
    this._parentContext = parentContext;
    this._redactKeys = config?.redactKeys;
    this._namespaces = config?.namespaces;
    this._namespaceMatcher = compileNamespaceMatcher(this._namespaces);
  }

  private _log(level: VKLogLevel, message: VKLogMessage, context?: Partial<VKLogContext>, error?: unknown) {
    if (LogLevels[level] < this._level) {
      return;
    }

    const moduleName = context?.module ?? this._parentContext.module ?? 'core';
    if (this._namespaceMatcher && !this._namespaceMatcher(moduleName)) {
      return;
    }

    const resolvedMessage = typeof message === 'function' ? message() : message;

    const mergedContext = {
      module: 'core',
      action: 'unspecified',
      ...this._parentContext,
      ...context,
    };

    const rawPayload = {
      level,
      timestamp: this._timeProvider.now().toISOString(),
      message: resolvedMessage,
      ...mergedContext,
      ...(error ? { error } : {}),
    };

    const payload = redact(rawPayload, this._redactKeys);

    if (this._sink) {
      this._sink(level, resolvedMessage, payload);
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
        case 'trace':
          // eslint-disable-next-line no-console
          if (typeof console.trace === 'function') {
            console.trace(prefix, resolvedMessage, Object.keys(restCtx).length > 0 ? restCtx : '');
          } else {
            console.debug(prefix, resolvedMessage, Object.keys(restCtx).length > 0 ? restCtx : '');
          }
          break;
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(prefix, resolvedMessage, Object.keys(restCtx).length > 0 ? restCtx : '');
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.info(prefix, resolvedMessage, Object.keys(restCtx).length > 0 ? restCtx : '');
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(prefix, resolvedMessage, Object.keys(restCtx).length > 0 ? restCtx : '');
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error(prefix, resolvedMessage, Object.keys(restCtx).length > 0 ? restCtx : '', error ?? '');
          break;
      }
    }
  }

  trace(message: VKLogMessage, context?: Partial<VKLogContext>): void {
    this._log('trace', message, context);
  }

  debug(message: VKLogMessage, context?: Partial<VKLogContext>): void {
    this._log('debug', message, context);
  }

  info(message: VKLogMessage, context?: Partial<VKLogContext>): void {
    this._log('info', message, context);
  }

  warn(message: VKLogMessage, context?: Partial<VKLogContext>): void {
    this._log('warn', message, context);
  }

  error(message: VKLogMessage, context?: Partial<VKLogContext>, error?: unknown): void {
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
        namespaces: this._namespaces,
      },
      nextContext,
    );
  }
}

