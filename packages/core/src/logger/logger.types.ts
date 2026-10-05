// [OR.01] Structured logger contracts
import type { VKTimeProvider } from '../abstractions/abstractions.types.js';

export type VKLogLevel = 'debug' | 'info' | 'warn' | 'error';

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
  readonly debug: (message: string, context?: Partial<VKLogContext>) => void;
  readonly info: (message: string, context?: Partial<VKLogContext>) => void;
  readonly warn: (message: string, context?: Partial<VKLogContext>) => void;
  readonly error: (message: string, context?: Partial<VKLogContext>, error?: unknown) => void;
  readonly child: (context: Partial<VKLogContext>) => VKLogger;
}

export interface VKLoggerConfig {
  readonly level?: VKLogLevel;
  readonly isProduction?: boolean;
  readonly timeProvider?: VKTimeProvider;
  readonly sink?: VKLoggerSink;
  readonly redactKeys?: readonly string[];
}
