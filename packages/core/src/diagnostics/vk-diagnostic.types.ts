// [BASE-01] Contract-First Type Definitions for Actionable Diagnostics
// [AP.01] Strict TypeScript Semantics: Zero any, immutable structures

export type VKDiagnosticSeverity = 'warning' | 'error' | 'info';

export interface VKDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly docsUrl: string;
  readonly severity?: VKDiagnosticSeverity;
  readonly component?: string;
  readonly hint?: string;
  readonly scope?: string;
}

export interface VKDevWarnOptions {
  readonly component?: string;
  readonly hint?: string;
  readonly scope?: string;
  /**
   * If true, suppresses repeated warnings with the same code/message combination.
   * @default true
   */
  readonly once?: boolean;
}
