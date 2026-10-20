// [CS.01] [AP.01] Progress notification event for HTTP transfer operations

/**
 * Represents progress data during HTTP upload or download operations.
 */
export interface VKHttpProgress {
  /** Number of bytes transferred so far. */
  readonly loaded: number;
  /** Total number of bytes if known (from Content-Length), or 0 if unknown. */
  readonly total: number;
  /** Calculated percentage between 0 and 100, or 0 if total is indeterminate. */
  readonly percent: number;
}
