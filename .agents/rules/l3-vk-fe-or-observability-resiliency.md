---
trigger: manual
---

# VK.Blocks FE: Observability & Resiliency (OR)

### OR.01 — Observability

#### Logging

- **Pattern**: Use a centralized `logger` module (e.g., `pino`, `winston`, or a custom wrapper) for ALL logging. NEVER use bare `console.log()`, `console.warn()`, `console.error()` in production code.
- **Enforcement**: Direct `console.*` calls are PROHIBITED in production code. Use ESLint `no-console` rule (configured to allow only in development/debug builds).
- **Structured Context**: ALL log entries MUST include structured context: `{ module, action, ...metadata }`. NO string concatenation or template literals for log messages.
- **TraceId / RequestId**: `traceId` or `requestId` is MANDATORY in all server-side log entries and API error responses.
- **Error Context**: Errors MUST be logged with full context (stack trace, request metadata) before mapping to `Result<T>`.
- **Client-Side**: Use a lightweight client-side error reporting service (e.g., Sentry, custom error boundary reporter). NEVER swallow errors silently.

#### Metrics & Analytics

- **Web Vitals**: Core Web Vitals (LCP, FID, CLS, INP) MUST be instrumented and monitored in production.
- **Custom Events**: ALL user interaction tracking MUST go through a centralized analytics service abstraction. NO direct vendor SDK calls in components.
- **Constants**: ALL event names and property keys MUST be defined in a `diagnosticsConstants.ts` file. Follow a consistent naming convention.

### OR.02 — Security

- **Tenant Isolation**: `tenantId` filtering MUST be enforced at the API/middleware layer. UI components MUST NOT bypass tenant isolation.
- **XSS Prevention**: NEVER use `dangerouslySetInnerHTML` without explicit sanitization (e.g., DOMPurify). ALL user-generated content MUST be sanitized.
- **CSRF**: ALL state-mutating API calls MUST include CSRF protection (token-based or SameSite cookie policy).
- **Auth Tokens**: Tokens MUST be stored in `httpOnly` cookies. NEVER store auth tokens in `localStorage` or `sessionStorage`.
- **PII**: ALL PII MUST be masked in logs and error reports. Use a dedicated masking utility.
- **Content Security Policy (CSP)**: MUST be configured in production. `unsafe-inline` and `unsafe-eval` are PROHIBITED unless explicitly justified and documented.

### OR.03 — Resiliency

- ALL external API calls MUST implement retry logic with exponential backoff (minimum: 3 retries).
- ALL external API calls MUST have explicit timeouts. NO indefinite waits (default timeout ≤ 30s).
- **Circuit Breaker**: For high-frequency external calls, implement a client-side circuit breaker pattern to prevent cascading failures.
- **Optimistic Updates**: For user-facing mutations, prefer optimistic UI updates with rollback on failure.
- **Offline Support**: Critical user flows SHOULD gracefully degrade when offline. Show clear offline indicators and queue operations for retry.
- **Error Boundaries**: EVERY feature module MUST have a React Error Boundary wrapping its root component. NEVER let a single component crash the entire app.
