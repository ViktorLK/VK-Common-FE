// [MB.02] Explicit barrel exports for @vk-blocks/api
// [ARCH-07] Unified Industrial HTTP Transport, Resilience & API Contract Layer

// --- 1. Core HTTP Client & Configuration ---
export type {
  VKHttpClient,
  VKHttpClientConfig,
  VKRequestOptions,
  VKQueryParamValue,
  VKHttpMetaResult,
  VKHttpRetryOptions,
} from './client/vk-http-client.js';

export {
  createVKHttpClient,
} from './client/vk-http-client-factory.js';

// --- 2. HTTP Transport Layer ---
export type {
  VKHttpRequest,
  VKHttpResponse,
  VKHttpTransport,
  VKFetchTransportOptions,
  VKTauriTransportOptions,
  VKElectronIpcRenderer,
  VKElectronTransportOptions,
  VKMemoryRouteHandler,
  VKMemoryTransportOptions,
} from './transport/vk-http-transport.js';

export {
  fetchHttpTransport,
  vkFetchHttpTransport,
  createVKFetchTransport,
  createVKTauriHttpTransport,
  createVKElectronHttpTransport,
  createVKMemoryHttpTransport,
  vkCreateResponseFromWeb,
} from './transport/vk-http-transport.js';

// --- 3. Transport Interceptors (Onion Pipeline) ---
export type {
  VKHttpInterceptor,
  VKHttpInterceptorContext,
  VKHttpInterceptorNext,
} from './interceptor/vk-http-interceptor.js';

export type {
  VKAuthInterceptorOptions,
} from './interceptor/vk-auth-interceptor.js';

export {
  createVKAuthInterceptor,
} from './interceptor/vk-auth-interceptor.js';

export type {
  VKTraceInterceptorOptions,
} from './interceptor/vk-trace-interceptor.js';

export {
  createVKTraceInterceptor,
} from './interceptor/vk-trace-interceptor.js';

export type {
  VKDeduplicationOptions,
} from './interceptor/vk-deduplication-interceptor.js';

export {
  createVKDeduplicationInterceptor,
  computeCanonicalRequestHash,
} from './interceptor/vk-deduplication-interceptor.js';

export type {
  VKSimulateInterceptorOptions,
} from './interceptor/vk-simulate-interceptor.js';

export {
  createVKSimulateInterceptor,
} from './interceptor/vk-simulate-interceptor.js';


// --- 4. Problem Details & Error Mappings (RFC 7807) ---
export type {
  VKProblemDetails,
  VKFieldError,
  VKErrorCategory,
} from './errors/vk-problem-details.js';

export {
  isVKProblemDetails,
  vkIsProblemDetails,
  vkParseProblemDetails,
} from './errors/vk-problem-details.js';

export {
  mapHttpStatusToErrorType,
  vkMapHttpStatusToErrorType,
} from './errors/vk-http-status-mapper.js';

// --- 5. Query Serialization & URL Utilities ---
export type {
  VKSortDirection,
  VKSortClause,
  VKFilterValue,
  VKListQuery,
  VKListQuerySerializeOptions,
} from './query/vk-list-query.js';

export {
  isVKListQuery,
  vkIsListQuery,
  vkSerializeListQuery,
  vkParseListQuery,
} from './query/vk-list-query.js';

export {
  buildApiPath,
  buildQueryString,
} from './utils/index.js';

export type {
  QueryStringOptions,
} from './utils/index.js';

// --- 6. Toolchain Adapters (Orval / openapi-fetch) ---
export type {
  VKCodegenRequestConfig,
} from './codegen/vk-codegen-adapter.js';

export {
  createVKCodegenMutator,
  vkCreateCodegenMutator,
} from './codegen/vk-codegen-adapter.js';

// --- 7. Telemetry, Constants & SPI ---
export type {
  VKHttpProgress,
} from './types/vk-http-progress.js';

export type {
  VKHttpMetric,
} from './types/vk-http-metric.js';

export type {
  VKTokenProvider,
} from './types/vk-token-provider.js';

export {
  VKHttpHeaders,
  VKMimeTypes,
} from './types/vk-http-constants.js';

export type {
  VKMapper,
} from './types/vk-mapper.js';

export {
  createVKMapper,
  vkMapArray,
  vkMapPagedResult,
  vkMapCursorPagedResult,
  vkMapResult,
} from './types/vk-mapper.js';

// --- 8. Envelope & DTOs ---
export type {
  VKPagination,
  VKPagedList,
  VKCursorPagination,
  VKCursorPagedList,
  VKApiMeta,
  VKApiError,
  VKApiErrorDto,
  VKApiResponse,
} from './types/envelope.js';

export {
  mapApiErrorDtoToVKError,
} from './types/envelope.js';

// --- 9. High-Level Typed API Client (Zod validation & invoke) ---
export {
  VKApiClient,
  isVKHttpClient,
  mapZodErrorToVKErrors,
} from './client/vk-api-client.js';

export type {
  VKApiClientInit,
  VKApiRequestConfig,
  VKApiGetOptions,
  VKApiMutationOptions,
  VKEndpointArgs,
} from './client/vk-api-client.js';

// --- 10. Validation Utilities ---
export {
  formatZodIssuePath,
} from './validation/zod-mapper.js';

// --- 11. Middleware Pipeline & Builtins ---
export type {
  VKApiRequestContext,
  VKApiNextFn,
  VKApiMiddleware,
  TokenProvider,
  HeaderProvider,
  TimingMiddlewareOptions,
} from './middleware/index.js';

export {
  executeMiddlewarePipeline,
  createBearerAuthMiddleware,
  createHeaderInjectionMiddleware,
  createTimingMiddleware,
} from './middleware/index.js';

// --- 12. Generated OpenAPI Contracts & Zod Schemas (DL.05) ---
export type {
  UserStatus,
  UserProfileDto,
  CreateUserCommand,
  ApiContractEndpoints,
} from './generated/api-contract.js';

export {
  UserStatusSchema,
  UserProfileDtoSchema,
  CreateUserCommandSchema,
} from './generated/api-contract.js';
