// [OR.02] PII Masking Utilities for logs, telemetry, and UI display
import { VKSecurityConstants } from './security.constants.js';

export interface VKMaskOptions {
  readonly keepStart?: number;
  readonly keepEnd?: number;
  readonly maskChar?: string;
}

/**
 * Masks a general string, keeping specified number of leading and trailing characters visible.
 */
export function maskString(value: string, options?: VKMaskOptions): string {
  if (!value) return '';

  const keepStart = Math.max(0, options?.keepStart ?? 0);
  const keepEnd = Math.max(0, options?.keepEnd ?? 0);
  const maskChar = options?.maskChar ?? VKSecurityConstants.DefaultMaskChar;

  if (value.length <= keepStart + keepEnd) {
    return maskChar.repeat(value.length);
  }

  const start = value.slice(0, keepStart);
  const end = keepEnd > 0 ? value.slice(-keepEnd) : '';
  const maskedLength = value.length - keepStart - keepEnd;
  const middle = maskChar.repeat(maskedLength);

  return `${start}${middle}${end}`;
}

/**
 * Masks an email address preserving the first char and domain (e.g. j***e@domain.com).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return VKSecurityConstants.DefaultMask;

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return VKSecurityConstants.DefaultMask;

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}*@${domain}`;
  }

  const maskedLocal = maskString(localPart, { keepStart: 1, keepEnd: 1, maskChar: '*' });
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks a phone number preserving the last 4 digits.
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return VKSecurityConstants.DefaultMask;
  }

  return maskString(phone, { keepEnd: 4, maskChar: '*' });
}
