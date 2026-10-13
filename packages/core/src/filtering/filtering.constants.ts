// [AP.01] Const object for Filter Verdicts
// [AP.03] Centralized constants for filtering slice

export const VKFilterVerdict = {
  Reject: 'reject',
  Keep: 'keep',
  ForceKeep: 'force-keep',
} as const;

export type VKFilterVerdict = (typeof VKFilterVerdict)[keyof typeof VKFilterVerdict];
