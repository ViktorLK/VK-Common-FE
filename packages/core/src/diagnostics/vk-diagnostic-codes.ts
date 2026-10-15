// [BASE-05] Centralized Diagnostic Error and Warning Codes
// [AP.01] Const-asserted stable codes avoiding inline string literals

export const VKDiagnosticCodes = {
  // Provider / Context Lifecycle
  MissingProvider: 'VK_DX_001_MISSING_PROVIDER',
  DuplicateProvider: 'VK_DX_002_DUPLICATE_PROVIDER',

  // React & Component Rules
  UnsafeClientOperation: 'VK_DX_003_UNSAFE_CLIENT_OPERATION',
  SsrHydrationRisk: 'VK_DX_004_SSR_HYDRATION_RISK',
  InvalidPropCombination: 'VK_DX_005_INVALID_PROP_COMBINATION',

  // API & Contracts
  ContractMismatch: 'VK_DX_006_CONTRACT_MISMATCH',
  UnboundedListQuery: 'VK_DX_007_UNBOUNDED_LIST_QUERY',

  // State & Cache
  UnsafeStateMutation: 'VK_DX_008_UNSAFE_STATE_MUTATION',
  MissingQueryKeyScope: 'VK_DX_009_MISSING_QUERY_KEY_SCOPE',

  // Deprecation & Migration
  DeprecatedApi: 'VK_DX_010_DEPRECATED_API',
} as const;

export type VKDiagnosticCode = (typeof VKDiagnosticCodes)[keyof typeof VKDiagnosticCodes];

const DOCS_BASE_URL = 'https://vk-blocks.dev/errors';

/**
 * Returns the official deep-link resolution URL for an actionable diagnostic code.
 */
export function getVKDiagnosticDocsUrl(code: string): string {
  return `${DOCS_BASE_URL}/${encodeURIComponent(code)}`;
}
