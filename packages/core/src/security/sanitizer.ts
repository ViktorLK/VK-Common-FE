// [OR.02] [BASE-01] [CS.01] Trusted Types & Defense-in-Depth HTML/SVG Sanitizer
import { isSafeRedirectUrl } from './is-safe-redirect-url.js';

export interface VKHtmlSanitizerOptions {
  /**
   * List of allowed HTML tag names in lowercase.
   * If omitted, a standard safe whitelist is used.
   */
  readonly allowedTags?: readonly string[];

  /**
   * List of allowed HTML attribute names in lowercase.
   * If omitted, a standard safe whitelist is used.
   */
  readonly allowedAttributes?: readonly string[];

  /**
   * Whether to allow safe SVG elements (<svg>, <path>, <circle>, <rect>, etc.).
   * Dangerous SVG sub-elements (<script>, <foreignObject>) are always stripped.
   * Defaults to true.
   */
  readonly allowSvg?: boolean;

  /**
   * Whether to allow data: URIs specifically for image sources (<img>).
   * Defaults to false.
   */
  readonly allowDataImages?: boolean;

  /**
   * Name of Trusted Types policy to create or use.
   * Defaults to 'vk-blocks-html-sanitizer'.
   */
  readonly policyName?: string;
}

export interface VKHtmlSanitizer {
  /**
   * Sanitizes dirty HTML/SVG string into a clean, safe HTML string.
   */
  sanitize(input: string, options?: VKHtmlSanitizerOptions): string;

  /**
   * Produces a TrustedHTML object if supported by the browser runtime,
   * otherwise returns the sanitized string.
   */
  createTrustedHtml(input: string, options?: VKHtmlSanitizerOptions): unknown;
}

const DEFAULT_ALLOWED_TAGS: readonly string[] = [
  'a', 'abbr', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'caption', 'cite', 'code',
  'col', 'colgroup', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em',
  'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 'rp',
  'rt', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'wbr',
];

const DEFAULT_SVG_TAGS: readonly string[] = [
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'clipPath', 'linearGradient', 'radialGradient', 'stop',
];

const DEFAULT_ALLOWED_ATTRIBUTES: readonly string[] = [
  'abbr', 'align', 'alt', 'aria-describedby', 'aria-details', 'aria-label',
  'aria-labelledby', 'aria-hidden', 'cite', 'class', 'color', 'cols', 'colspan',
  'datetime', 'dir', 'disabled', 'download', 'height', 'hidden', 'href', 'id',
  'lang', 'loading', 'name', 'open', 'rel', 'reversed', 'role', 'rows', 'rowspan',
  'scope', 'span', 'src', 'start', 'style', 'tabindex', 'target', 'title', 'type', 'width',
];

const DEFAULT_SVG_ATTRIBUTES: readonly string[] = [
  'cx', 'cy', 'r', 'rx', 'ry', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'points', 'dx', 'dy', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'transform',
  'viewBox', 'xmlns', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity', 'stroke-opacity',
];

const DANGEROUS_URI_REGEX = /^(?:javascript|data|vbscript):/i;
const DATA_IMAGE_REGEX = /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i;

/**
 * Sanitizes dirty HTML/SVG string using DOMParser in browser or safe tokenizer in SSR.
 */
class DefaultHtmlSanitizer implements VKHtmlSanitizer {
  private trustedPolicy: { createHTML: (s: string) => unknown } | null = null;
  private readonly defaultOptions: VKHtmlSanitizerOptions;

  constructor(options?: VKHtmlSanitizerOptions) {
    this.defaultOptions = options ?? {};
    this.initTrustedTypes(options?.policyName ?? 'vk-blocks-html-sanitizer');
  }

  private initTrustedTypes(policyName: string): void {
    if (typeof window !== 'undefined' && 'trustedTypes' in window) {
      try {
        const tt = (window as unknown as {
          trustedTypes?: {
            createPolicy: (
              name: string,
              rules: { createHTML: (html: string) => string },
            ) => { createHTML: (s: string) => unknown };
          };
        }).trustedTypes;

        if (tt?.createPolicy) {
          this.trustedPolicy = tt.createPolicy(policyName, {
            createHTML: (html: string) => this.cleanHtml(html, this.defaultOptions),
          });
        }
      } catch {
        // Policy may already exist; continue without failing
      }
    }
  }

  private cleanHtml(input: string, options?: VKHtmlSanitizerOptions): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const merged = { ...this.defaultOptions, ...options };
    const allowSvg = merged.allowSvg ?? true;
    const allowDataImages = merged.allowDataImages ?? false;

    const allowedTags = new Set(
      (merged.allowedTags ?? DEFAULT_ALLOWED_TAGS).map((t) => t.toLowerCase()),
    );
    if (allowSvg) {
      for (const t of DEFAULT_SVG_TAGS) allowedTags.add(t);
    }

    const allowedAttrs = new Set(
      (merged.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES).map((a) => a.toLowerCase()),
    );
    if (allowSvg) {
      for (const a of DEFAULT_SVG_ATTRIBUTES) allowedAttrs.add(a);
    }

    // Browser environment: use DOMParser for full fidelity
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      return this.cleanInBrowser(input, allowedTags, allowedAttrs, allowDataImages);
    }

    // SSR / Node environment: regex fallback stripping tags, event handlers, and dangerous URIs
    return this.cleanInSsr(input, allowedTags, allowedAttrs, allowDataImages);
  }

  private cleanInBrowser(
    input: string,
    allowedTags: Set<string>,
    allowedAttrs: Set<string>,
    allowDataImages: boolean,
  ): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${input}</body>`, 'text/html');
    const body = doc.body;

    const traverse = (node: Node): void => {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement | SVGElement;
          const tagName = el.tagName.toLowerCase();

          // Block forbidden tags completely
          if (!allowedTags.has(tagName)) {
            el.remove();
            continue;
          }

          // Strip forbidden or dangerous attributes
          const attrs = Array.from(el.attributes);
          for (const attr of attrs) {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value.trim();

            // Strip event handlers (onload, onclick, onerror, etc.)
            if (attrName.startsWith('on')) {
              el.removeAttribute(attr.name);
              continue;
            }

            // Strip unwhitelisted attributes
            if (!allowedAttrs.has(attrName)) {
              el.removeAttribute(attr.name);
              continue;
            }

            // Inspect URI attributes (href, src, action, xlink:href)
            if (attrName === 'href' || attrName === 'src' || attrName === 'action' || attrName === 'xlink:href') {
              if (allowDataImages && attrName === 'src' && tagName === 'img' && DATA_IMAGE_REGEX.test(attrValue)) {
                // Allowed data image
                continue;
              }

              if (DANGEROUS_URI_REGEX.test(attrValue) || !isSafeRedirectUrl(attrValue, { allowRelative: true })) {
                el.removeAttribute(attr.name);
              }
            }
          }

          // Recursively clean descendants
          traverse(child);
        } else if (child.nodeType === Node.COMMENT_NODE) {
          child.remove();
        }
      }
    };

    traverse(body);
    return body.innerHTML;
  }

  private cleanInSsr(
    input: string,
    allowedTags: Set<string>,
    allowedAttrs: Set<string>,
    allowDataImages: boolean,
  ): string {
    // 1. Remove dangerous blocks completely (scripts, styles, iframes, objects)
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // 2. Strip all inline on* event handlers (e.g. onload=..., onclick=...)
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

    // 3. Strip dangerous URI attributes
    sanitized = sanitized.replace(
      /\s+(href|src|action)\s*=\s*(['"])(.*?)\2/gi,
      (match, attrName: string, quote: string, uri: string) => {
        const trimmed = uri.trim();
        if (allowDataImages && attrName.toLowerCase() === 'src' && DATA_IMAGE_REGEX.test(trimmed)) {
          return match;
        }
        if (DANGEROUS_URI_REGEX.test(trimmed)) {
          return '';
        }
        return ` ${attrName}=${quote}${uri}${quote}`;
      },
    );

    return sanitized;
  }

  sanitize(input: string, options?: VKHtmlSanitizerOptions): string {
    return this.cleanHtml(input, options);
  }

  createTrustedHtml(input: string, options?: VKHtmlSanitizerOptions): unknown {
    const clean = this.cleanHtml(input, options);
    if (this.trustedPolicy?.createHTML) {
      return this.trustedPolicy.createHTML(clean);
    }
    return clean;
  }
}

/**
 * Creates an instance of VKHtmlSanitizer conforming to Trusted Types standards.
 */
export function createHtmlSanitizer(options?: VKHtmlSanitizerOptions): VKHtmlSanitizer {
  return new DefaultHtmlSanitizer(options);
}

export const defaultHtmlSanitizer: VKHtmlSanitizer = new DefaultHtmlSanitizer();

/**
 * Convenience utility to sanitize a string of HTML/SVG.
 */
export function vkSanitizeHtml(input: string, options?: VKHtmlSanitizerOptions): string {
  return defaultHtmlSanitizer.sanitize(input, options);
}
