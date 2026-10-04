---
trigger: manual
---

# VK.Blocks FE: Core Standards (CS)

### CS.01 — Result Pattern

- Application Layer (Services / Server Actions / API Route Handlers): RETURN `Result<T>` objects only. NEVER return raw `null` or `undefined` as a response type.
- For void operations, use `Result<void>`. NEVER return bare `void` or unstructured responses from Application Layer functions.
- NEVER use `Result.failure("raw string")`. ALWAYS use predefined `Error` constants from a centralized error registry.
- **Error Constants Hierarchy**: Define error codes using the `{ModuleName}.{Category}.{Reason}` format (e.g., `Auth.ApiKey.Invalid`). Use a global `vkCoreErrors.ts` for shared cross-block errors, and a `errors.ts` file within each block for block-specific errors.
- Infrastructure Layer (API clients, fetch wrappers): Exceptions ARE allowed, but MUST be caught at the boundary and mapped to `Result<T>`.
- API responses MUST follow RFC 7807 for HTTP error responses.
- `Result<T>` MUST carry structured Error objects, never raw strings or Error instances.

### CS.02 — Layer Dependencies

- **Core/Application Layer**: NO direct dependency on infrastructure libraries (specific DB clients, cloud SDKs, browser APIs) in shared logic.
- React Server Components / Server Actions are allowed as the orchestration mechanism in the Application Layer (Next.js).
- All infrastructure concerns (API calls, storage, auth providers) MUST be abstracted behind interfaces or service contracts (TypeScript `interface` / `type`).
- **Client/Server Boundary**: NEVER import server-only modules in client components. Use the `"use server"` / `"use client"` directives correctly.

### CS.03 — Async

- Use `async/await` for ALL asynchronous I/O operations.
- NO callback-based patterns for new code. Prefer `async/await` over `.then()` chains.
- ALWAYS handle `AbortSignal` / `AbortController` for cancellable operations (fetch, long-running tasks).
- NO unhandled promise rejections. EVERY async call MUST be wrapped in proper error handling (try/catch or `.catch()`).
- **Server Components**: Prefer `async` Server Components with direct `await` over `useEffect` for data fetching.
- **Client Components**: Use `useTransition` or `useDeferredValue` for non-urgent updates. NEVER `await` inside render.

### CS.04 — Performance

- NO data fetching inside loops or repeated renders.
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` judiciously — only when profiling shows a measurable benefit. Do NOT over-memoize.
- **Bundle Size**: NEVER import entire libraries when a specific named export suffices (e.g., `import { debounce } from 'lodash-es'` NOT `import _ from 'lodash'`).
- ALL list renders MUST use stable, unique `key` props. NEVER use array index as key for dynamic lists.
- **Images**: ALWAYS use `next/image` (or equivalent optimized component) instead of raw `<img>` tags. Configure width/height or `fill` to prevent layout shifts.
- **Code Splitting**: Use `next/dynamic` or `React.lazy` for components not needed on initial load.
- **Pagination**: NEVER fetch unbounded collections. ALL list queries MUST include explicit pagination (`limit`/`offset` or cursor-based).

### CS.05 — Automation

- **Timestamps**: `createdAt` / `updatedAt` fields MUST be handled via server-side middleware or API layer interceptors. NO manual timestamp logic in UI components.
- **Soft Delete**: Soft delete filtering MUST be handled at the API/data layer. UI MUST NOT implement its own soft-delete filtering logic.
- **Form Validation**: Use schema-based validation (e.g., Zod) with shared schemas between client and server. NO manual validation logic scattered across components.

### CS.06 — Core Abstractions

- **Deterministic Logic**: PROHIBIT direct use of non-deterministic system APIs within shared building block logic.
- **IDs**: Use a centralized `generateId()` utility (injected or imported from a shared module) instead of inline `crypto.randomUUID()` or `Math.random()`.
- **Time**: Use a `TimeProvider` abstraction (or `dayjs`/`date-fns` via a shared utility) instead of raw `new Date()` / `Date.now()` in business logic. Raw `Date` is allowed in UI-only formatting.
- **Serialization**: Use a centralized `vkSerializer` utility for all JSON serialization/deserialization that requires custom handling (e.g., date reviving, BigInt support).

### CS.07 — Environment & Configuration

- **Mandatory Validation**: ALL environment variables MUST be validated at startup using a schema (e.g., Zod). NEVER use `process.env.X` directly in application code without validation.
- **Typed Config**: Access environment configuration via a typed `env.ts` module that exports validated, typed values.
- **Client vs Server**: STRICTLY separate `NEXT_PUBLIC_*` (client-exposed) from server-only env vars. NEVER expose secrets to the client bundle.
- **Fail Fast**: Missing or invalid required env vars MUST cause an immediate build/startup failure with a descriptive error message.
