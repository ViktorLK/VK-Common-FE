// [CS.01] Datetime error codes
export const VKDatetimeErrorCodes = {
  InvalidFormat: 'Core.Date.InvalidFormat',
  InvalidValue: 'Core.Date.InvalidValue',
  InvalidTimeZone: 'Core.Date.InvalidTimeZone',
} as const;

export type VKDatetimeErrorCode = (typeof VKDatetimeErrorCodes)[keyof typeof VKDatetimeErrorCodes];

