// [AP.01] Immutable constants
// [CS.03] Standard timeouts across VK.Blocks ecosystem

/**
 * Standard timeouts in milliseconds.
 */
export const VKTimeouts = {
  DefaultMs: 30000,
  ShortMs: 5000,
  LongMs: 60000,
} as const;
