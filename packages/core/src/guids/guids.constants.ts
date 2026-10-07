// [AP.03] Centralized constants for GUID slice

export const VK_EMPTY_GUID = '00000000-0000-0000-0000-000000000000' as const;

export const VK_GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const VK_DEFAULT_GUID_TYPE = 'v7' as const;
