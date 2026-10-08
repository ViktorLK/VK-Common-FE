// [CS.01] Centralized Error codes for context slice

export const VKContextErrorCodes = {
  MissingTenant: 'Core.Context.MissingTenant',
  MissingUser: 'Core.Context.MissingUser',
  InvalidScope: 'Core.Context.InvalidScope',
} as const;
