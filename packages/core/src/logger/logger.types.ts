// [OR.01] Structured logger contracts
import type { VKTimeProvider } from '../abstractions/abstractions.types.js';

export type VKLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export type VKLogMessage = string | (() => string);

export interface VKLogContext {
  readonly module: string;
  readonly action: string;
  readonly traceId?: string;
  readonly [key: string]: unknown;
}

export type VKLoggerSink = (
  level: VKLogLevel,
  message: string,
  payload: Readonly<Record<string, unknown>>,
) => void;

export interface VKLogger {
  readonly trace: (message: VKLogMessage, context?: Partial<VKLogContext>) => void;
  readonly debug: (message: VKLogMessage, context?: Partial<VKLogContext>) => void;
  readonly info: (message: VKLogMessage, context?: Partial<VKLogContext>) => void;
  readonly warn: (message: VKLogMessage, context?: Partial<VKLogContext>) => void;
  readonly error: (message: VKLogMessage, context?: Partial<VKLogContext>, error?: unknown) => void;
  readonly child: (context: Partial<VKLogContext>) => VKLogger;
}

export interface VKLoggerConfig {
  readonly level?: VKLogLevel;
  readonly isProduction?: boolean;
  readonly timeProvider?: VKTimeProvider;
  readonly sink?: VKLoggerSink;
  readonly redactKeys?: readonly string[];
  readonly namespaces?: string;
  readonly defaultToNoOpInProduction?: boolean;
}

