// [OR.02] Security and URL Validation contracts
export type { VKMaskOptions } from './mask-pii.js';

export interface VKRedirectValidationOptions {
  readonly allowedOrigins?: readonly string[];
  readonly allowRelative?: boolean;
}

/**
 * @deprecated Use `VKRedirectValidationOptions` instead.
 */
export type RedirectValidationOptions = VKRedirectValidationOptions;
