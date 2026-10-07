// [OR.01] Logger constants and default sanitization keys
import type { VKLogLevel } from './logger.types.js';

export const DEFAULT_LOG_LEVEL: VKLogLevel = 'info';

export const DEFAULT_REDACT_KEYS: readonly string[] = [
  'password',
  'token',
  'authorization',
  'secret',
  'apikey',
  'accesstoken',
  'refreshtoken',
  'clientsecret',
  'creditcard',
] as const;
