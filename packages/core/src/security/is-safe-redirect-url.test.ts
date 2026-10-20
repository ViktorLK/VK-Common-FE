import { describe, it, expect } from 'vitest';
import { isSafeRedirectUrl } from './index.js';

describe('isSafeRedirectUrl', () => {
  it('allows safe relative paths', () => {
    expect(isSafeRedirectUrl('/dashboard')).toBe(true);
    expect(isSafeRedirectUrl('/profile?tab=settings')).toBe(true);
  });

  it('rejects relative path when allowRelative is false', () => {
    expect(isSafeRedirectUrl('/dashboard', { allowRelative: false })).toBe(false);
  });

  it('rejects dangerous protocols and scheme-relative URLs', () => {
    expect(isSafeRedirectUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeRedirectUrl('data:text/html,...')).toBe(false);
    expect(isSafeRedirectUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeRedirectUrl('//evil.com')).toBe(false);
    expect(isSafeRedirectUrl('/\\evil.com')).toBe(false);
    expect(isSafeRedirectUrl('\\\\evil.com')).toBe(false);
    expect(isSafeRedirectUrl('\\/evil.com')).toBe(false);
  });

  it('rejects control characters obfuscating dangerous URLs', () => {
    // Tab in javascript: protocol
    expect(isSafeRedirectUrl('java\tscript:alert(1)')).toBe(false);
    // Newline in scheme-relative URL
    expect(isSafeRedirectUrl('\r\n//evil.com')).toBe(false);
    // Null byte bypass
    expect(isSafeRedirectUrl('/dashboard\0')).toBe(true); // stripped to /dashboard
    expect(isSafeRedirectUrl('javascript\0:alert(1)')).toBe(false);
  });

  it('validates absolute URLs against allowed origins', () => {
    const options = { allowedOrigins: ['https://myapp.com'] };

    expect(isSafeRedirectUrl('https://myapp.com/callback', options)).toBe(true);
    expect(isSafeRedirectUrl('https://evil.com/phish', options)).toBe(false);
    expect(isSafeRedirectUrl('http://myapp.com/callback', options)).toBe(false); // protocol mismatch
  });

  it('rejects absolute URLs by default when no origin whitelist provided', () => {
    expect(isSafeRedirectUrl('https://google.com')).toBe(false);
  });

  it('handles null, undefined, and non-string inputs safely', () => {
    expect(isSafeRedirectUrl(null)).toBe(false);
    expect(isSafeRedirectUrl(undefined)).toBe(false);
    expect(isSafeRedirectUrl('')).toBe(false);
    expect(isSafeRedirectUrl('   ')).toBe(false);
  });
});
