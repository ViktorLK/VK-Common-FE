// [OR.01] Centralized structured logging abstractions
// [CS.06] Injected time provider for deterministic log timestamps
import { VKTimeProvider } from '../abstractions/vk-time-provider.js';

export interface VKLogContext {
  readonly module: string;
  readonly action: string;
  readonly traceId?: string;
  readonly [key: string]: unknown;
}

export type VKLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface VKLogger {
  readonly debug: (message: string, context: VKLogContext) => void;
  readonly info: (message: string, context: VKLogContext) => void;
  readonly warn: (message: string, context: VKLogContext) => void;
  readonly error: (message: string, context: VKLogContext, error?: unknown) => void;
}

export interface VKLoggerConfig {
  readonly level?: VKLogLevel;
  readonly isProduction?: boolean;
  readonly timeProvider?: VKTimeProvider;
  readonly sink?: (level: VKLogLevel, message: string, payload: Readonly<Record<string, unknown>>) => void;
}


