// [CS.01] Schema validation error codes registry
export const VKSchemaErrorCodes = {
  ValidationFailed: 'Core.Schema.ValidationFailed',
  InvalidSchema: 'Core.Schema.InvalidSchema',
} as const;

export type VKSchemaErrorCode = (typeof VKSchemaErrorCodes)[keyof typeof VKSchemaErrorCodes];
