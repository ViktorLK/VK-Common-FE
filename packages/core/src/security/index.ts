// [MB.02] Explicit barrel export
export type {
  VKRedirectValidationOptions,
  RedirectValidationOptions,
  VKMaskOptions,
} from './security.types.js';
export { VKSecurityConstants } from './security.constants.js';
export { isSafeRedirectUrl } from './is-safe-redirect-url.js';
export { VKSensitiveString } from './vk-sensitive-string.js';
export { maskString, maskEmail, maskPhone } from './mask-pii.js';
export {
  createHtmlSanitizer,
  defaultHtmlSanitizer,
  vkSanitizeHtml,
} from './sanitizer.js';
export type {
  VKHtmlSanitizer,
  VKHtmlSanitizerOptions,
} from './sanitizer.js';

// RSC Data Tainting (React 19 Server Components)
export {
  VK_TAINTED_SYMBOL,
  VKDefaultDataTainter,
  setVKDataTainter,
  getVKDataTainter,
  vkTaintSecret,
  vkTaintObject,
  vkTaintSession,
  isVKTainted,
  assertNotTainted,
} from './taint.js';
export type { IVKDataTainter } from './taint.js';

// Strict Content Security Policy (CSP) Engine
export {
  validateCspNonce,
  generateCspNonce,
  buildContentSecurityPolicy,
  createStrictCspDirectives,
} from './csp.js';
export type { VKCspDirectives, VKBuildCspOptions } from './csp.js';
