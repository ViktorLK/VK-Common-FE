/**
 * Utility type for creating branded (nominal) types in TypeScript.
 * Useful for ensuring type safety across different ID types (e.g., UserId vs TenantId).
 */
export type Branded<T, Brand extends string> = T & { readonly __brand: Brand };

/**
 * Example usage:
 * export type UserId = Branded<string, 'UserId'>;
 * export type TenantId = Branded<string, 'TenantId'>;
 */
