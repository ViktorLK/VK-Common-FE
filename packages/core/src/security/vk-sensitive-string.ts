// [OR.02] PII & Secret Redaction wrapper
// Prevents accidental leakage in logs, console, telemetry, and JSON.stringify
import { VKSecurityConstants } from './security.constants.js';

export class VKSensitiveString {
  private readonly value: string;

  constructor(value: string) {
    this.value = value ?? '';
  }

  /**
   * Returns true if the wrapped string is empty.
   */
  get isEmpty(): boolean {
    return this.value.length === 0;
  }

  /**
   * Returns a masked representation ('********') to prevent accidental leakage.
   */
  toString(): string {
    return VKSecurityConstants.DefaultMask;
  }

  /**
   * Returns a masked representation for JSON serialization.
   */
  toJSON(): string {
    return VKSecurityConstants.DefaultMask;
  }

  /**
   * Custom inspect hook for Node.js console.log and util.inspect.
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `[VKSensitiveString: ${VKSecurityConstants.DefaultMask}]`;
  }

  /**
   * Primitive conversion hook.
   */
  [Symbol.toPrimitive](hint: string): string | number {
    return hint === 'number' ? NaN : VKSecurityConstants.DefaultMask;
  }

  /**
   * Reveals the underlying sensitive value.
   * MUST only be called at the final integration boundary (e.g. HTTP Authorization header).
   */
  reveal(): string {
    return this.value;
  }

  /**
   * Factory function to create a new VKSensitiveString instance.
   */
  static from(value: string): VKSensitiveString {
    return new VKSensitiveString(value);
  }
}
