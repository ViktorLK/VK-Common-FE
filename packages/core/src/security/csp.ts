// [BASE-01] [AP.01] [OR.02]
// Strict Content Security Policy (CSP) Directives Engine and Nonce Utilities
import { assertDefined } from '../assert/vk-assert.js';

/**
 * Standard W3C / MDN Content Security Policy Directives interface.
 */
export interface VKCspDirectives {
  readonly defaultSrc?: readonly string[];
  readonly scriptSrc?: readonly string[];
  readonly scriptSrcElem?: readonly string[];
  readonly scriptSrcAttr?: readonly string[];
  readonly styleSrc?: readonly string[];
  readonly styleSrcElem?: readonly string[];
  readonly styleSrcAttr?: readonly string[];
  readonly connectSrc?: readonly string[];
  readonly imgSrc?: readonly string[];
  readonly fontSrc?: readonly string[];
  readonly mediaSrc?: readonly string[];
  readonly objectSrc?: readonly string[];
  readonly childSrc?: readonly string[];
  readonly frameSrc?: readonly string[];
  readonly workerSrc?: readonly string[];
  readonly frameAncestors?: readonly string[];
  readonly formAction?: readonly string[];
  readonly baseUri?: readonly string[];
  readonly manifestSrc?: readonly string[];
  readonly reportUri?: string;
  readonly reportTo?: string;
  readonly upgradeInsecureRequests?: boolean;
  readonly blockAllMixedContent?: boolean;
}

/**
 * Options for CSP policy compilation.
 */
export interface VKBuildCspOptions {
  readonly nonce?: string;
  readonly strictDynamic?: boolean;
  readonly isReportOnly?: boolean;
}

const CSP_NONCE_REGEX = /^[A-Za-z0-9+/=_-]{16,64}$/;

/**
 * Validates that a CSP nonce string is well-formed Base64 / URL-safe Base64
 * and contains no header/directive injection characters (\r, \n, ;, ", ').
 */
export function validateCspNonce(nonce: string): boolean {
  if (!nonce || typeof nonce !== 'string') {
    return false;
  }
  if (/[\r\n;,"']/.test(nonce)) {
    return false;
  }
  return CSP_NONCE_REGEX.test(nonce);
}

/**
 * Generates a cryptographically secure 128-bit (16-byte) Base64 encoded nonce.
 */
export function generateCspNonce(cryptoInstance?: Crypto): string {
  const c = cryptoInstance ?? (typeof crypto !== 'undefined' ? crypto : undefined);
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error('[OR.02] Web Crypto API is required to generate a CSP nonce.');
  }

  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);

  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b !== undefined) {
        binary += String.fromCharCode(b);
      }
    }
    return btoa(binary);
  }

  // Node.js Buffer fallback
  const g = globalThis as Record<string, unknown>;
  const BufferClass = g.Buffer as { from: (arr: Uint8Array) => { toString: (enc: string) => string } } | undefined;
  if (BufferClass && typeof BufferClass.from === 'function') {
    return BufferClass.from(bytes).toString('base64');
  }

  throw new Error('[OR.02] Base64 encoding capability unavailable for CSP nonce.');
}

/**
 * Converts camelCase directive key to kebab-case CSP directive name.
 */
function directiveKeyToKebab(key: string): string {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Compiles a VKCspDirectives object into a standard RFC Content-Security-Policy header string.
 * Automatically injects nonce tokens into script-src and style-src if a nonce is provided.
 */
export function buildContentSecurityPolicy(
  directives: VKCspDirectives,
  options?: VKBuildCspOptions,
): string {
  assertDefined(directives, 'Directives object must be defined.');

  const nonce = options?.nonce;
  if (nonce !== undefined && !validateCspNonce(nonce)) {
    throw new Error(`[OR.02] Invalid CSP nonce format: "${nonce}"`);
  }

  const nonceToken = nonce ? `'nonce-${nonce}'` : undefined;
  const parts: string[] = [];

  const directiveEntries: Array<[keyof VKCspDirectives, string]> = [
    ['defaultSrc', 'default-src'],
    ['scriptSrc', 'script-src'],
    ['scriptSrcElem', 'script-src-elem'],
    ['scriptSrcAttr', 'script-src-attr'],
    ['styleSrc', 'style-src'],
    ['styleSrcElem', 'style-src-elem'],
    ['styleSrcAttr', 'style-src-attr'],
    ['connectSrc', 'connect-src'],
    ['imgSrc', 'img-src'],
    ['fontSrc', 'font-src'],
    ['mediaSrc', 'media-src'],
    ['objectSrc', 'object-src'],
    ['childSrc', 'child-src'],
    ['frameSrc', 'frame-src'],
    ['workerSrc', 'worker-src'],
    ['frameAncestors', 'frame-ancestors'],
    ['formAction', 'form-action'],
    ['baseUri', 'base-uri'],
    ['manifestSrc', 'manifest-src'],
  ];

  for (const [key, directiveName] of directiveEntries) {
    const rawSources = directives[key] as readonly string[] | undefined;
    let sources: string[] = rawSources ? [...rawSources] : [];

    // Inject nonce into script-src and style-src if not already present
    if (nonceToken) {
      if (directiveName === 'script-src' || directiveName === 'style-src') {
        if (!sources.includes(nonceToken)) {
          sources = [nonceToken, ...sources];
        }
      }
    }

    if (options?.strictDynamic && directiveName === 'script-src') {
      if (!sources.includes("'strict-dynamic'")) {
        sources.push("'strict-dynamic'");
      }
    }

    if (sources.length > 0) {
      parts.push(`${directiveName} ${sources.join(' ')}`);
    }
  }

  if (directives.upgradeInsecureRequests) {
    parts.push('upgrade-insecure-requests');
  }

  if (directives.blockAllMixedContent) {
    parts.push('block-all-mixed-content');
  }

  if (directives.reportUri) {
    parts.push(`report-uri ${directives.reportUri}`);
  }

  if (directives.reportTo) {
    parts.push(`report-to ${directives.reportTo}`);
  }

  return parts.join('; ');
}

/**
 * Creates a zero-trust Strict Content Security Policy baseline adhering to W3C Level 3
 * recommendations, strictly prohibiting 'unsafe-inline' and 'unsafe-eval'.
 */
export function createStrictCspDirectives(options?: {
  nonce?: string;
  additionalConnectSrc?: readonly string[];
  reportUri?: string;
}): VKCspDirectives {
  const nonce = options?.nonce;
  const scriptSources: string[] = ["'self'", "'strict-dynamic'", "'wasm-unsafe-eval'"];
  const styleSources: string[] = ["'self'"];

  if (nonce && validateCspNonce(nonce)) {
    scriptSources.unshift(`'nonce-${nonce}'`);
    styleSources.unshift(`'nonce-${nonce}'`);
  }

  return {
    defaultSrc: ["'self'"],
    scriptSrc: scriptSources,
    styleSrc: styleSources, // [OR.02] Zero unsafe-inline
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    connectSrc: ["'self'", ...(options?.additionalConnectSrc ?? [])],
    upgradeInsecureRequests: true,
    reportUri: options?.reportUri,
  };
}
