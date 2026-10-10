// [CS.01] Provider registry error codes
export const VKProviderErrorCodes = {
  ServiceNotFound: 'Core.Provider.ServiceNotFound',
  DuplicateRegistration: 'Core.Provider.DuplicateRegistration',
  DisposedScope: 'Core.Provider.DisposedScope',
} as const;

export type VKProviderErrorCode = (typeof VKProviderErrorCodes)[keyof typeof VKProviderErrorCodes];
