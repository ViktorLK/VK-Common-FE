---
trigger: manual
---

# VK.Blocks FE: Module Blueprint (MB)

> **Note**: This file provides the concrete blueprint and implementation templates for the architectural principles defined in `04-architecture-patterns.md` (specifically AP.02–AP.05). This is the frontend counterpart to the backend's Building Block Blueprint.

### MB.01 — Standard Folder Structure & Naming Conventions

Every feature module MUST prioritize a domain-driven feature-first layout. Generic technical folders should be used sparingly as a last resort.

**File & Folder Naming Conventions (MANDATORY)**:
- **Packages & Directories**: `kebab-case` (e.g., `@vk-blocks/chat`, `feature-name`).
- **React Components**: `PascalCase` (e.g., `VKChatWindow.tsx`, `SessionManager.tsx`).
- **Hooks**: `camelCase` (e.g., `useChat.ts`, `useSession.ts`).
- **Utils / APIs / Stores / Configs**: `camelCase` (e.g., `formatTime.ts`, `pwpClient.ts`, `chatStore.ts`).

**Internal Scoping Rule**: An `_internal/` folder at any level means implementation details that MUST NOT be imported from outside that folder's parent scope.

```
src/
├── app/                          # Next.js App Router (pages, layouts, routes)
│   ├── (auth)/                   # Route groups for auth-related pages
│   ├── (dashboard)/              # Route groups for dashboard pages
│   ├── api/                      # API Route Handlers
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── features/                     # Feature modules (MANDATORY)
│   └── {feature-name}/
│       ├── index.ts              # Public barrel export (public API surface)
│       ├── components/           # Feature-specific components
│       ├── hooks/                # Feature-specific hooks
│       ├── services/             # Feature-specific services / API clients
│       ├── types.ts              # Feature-specific types
│       ├── constants.ts          # Feature-specific constants
│       ├── schemas.ts            # Feature-specific Zod schemas
│       └── _internal/            # Internal implementation details
├── shared/                       # Cross-cutting shared code (MANDATORY)
│   ├── components/               # Shared UI primitives (VKButton, VKInput, etc.)
│   ├── hooks/                    # Shared hooks (VKUseAuth, VKUseTheme, etc.)
│   ├── services/                 # Shared service abstractions
│   ├── types/                    # Shared type definitions
│   ├── utils/                    # Shared utility functions
│   ├── constants/                # Global constants
│   └── config/                   # App-wide configuration (env.ts, etc.)
├── providers/                    # React context providers (auth, theme, etc.)
└── styles/                       # Global styles, design tokens, CSS modules
```

### MB.02 — Module Registration Pattern

Each feature module MUST define a clear public API via barrel exports:

```typescript
// features/auth/index.ts — Public API Surface
export { VKAuthProvider } from './components/AuthProvider';
export { VKUseAuth } from './hooks/useAuth';
export { VKLoginForm } from './components/LoginForm';
export type { VKAuthState, VKAuthUser } from './types';
```

**Rules**:

- **Single Entry Point**: Consumers MUST import from the barrel (`features/auth`) not from internal paths (`features/auth/_internal/tokenManager`).
- **Explicit Exports**: NEVER use `export *`. Every public export MUST be explicitly listed.
- **ESLint Enforcement**: Configure `eslint-plugin-import` with `no-restricted-paths` to prevent internal imports from outside the module.

### MB.03 — Provider Pattern (Dependency Injection)

For dependency injection in React, use the Provider pattern:

```typescript
// providers/VKServiceProvider.tsx
interface VKServiceContextValue {
  readonly logger: VKLogger;
  readonly apiClient: VKApiClient;
  readonly analytics: VKAnalytics;
}

const VKServiceContext = createContext<VKServiceContextValue | null>(null);

export function VKServiceProvider({ children, config }: VKServiceProviderProps) {
  const services = useMemo(() => createServices(config), [config]);
  return (
    <VKServiceContext.Provider value={services}>
      {children}
    </VKServiceContext.Provider>
  );
}

export function useVKServices(): VKServiceContextValue {
  const ctx = useContext(VKServiceContext);
  if (ctx === null) {
    throw new Error('useVKServices must be used within VKServiceProvider');
  }
  return ctx;
}
```

**Rules**:

- **Fail Fast**: ALWAYS throw an error when a required context is `null` (missing provider). NEVER return `null` from context hooks.
- **Typed Contexts**: ALL contexts MUST have a typed value. NO `any` or untyped contexts.
- **Provider Composition**: Use a `VKProviders` composite provider to avoid deep nesting in the root layout.

### MB.04 — API Route Blueprint (Next.js)

API Route Handlers MUST follow this pattern:

```typescript
// app/api/{resource}/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Parse & validate input (Zod)
  // 2. Auth & authorization check
  // 3. Call service layer
  // 4. Map result to response
  // 5. Return typed response
}
```

**Rules**:

- **Validation First**: ALL input (params, query, body) MUST be validated via Zod schema before processing.
- **No Business Logic**: API route handlers MUST delegate to service/use-case functions. NO business logic in route files.
- **Error Mapping**: Use a centralized `mapResultToResponse()` utility to convert `Result<T>` to `NextResponse`.
- **Response Types**: ALL responses MUST conform to a standardized envelope: `{ data, error, meta }`.

### MB.05 — Configuration & Feature Flags

- **Typed Config**: Each module that requires configuration MUST define a typed config interface (e.g., `VKAuthConfig`).
- **Environment Binding**: Config values MUST be bound from validated environment variables (see CS.07). NO hardcoded values.
- **Feature Flags**: Use a centralized feature flag provider. Components MUST check flags via a hook (`useVKFeatureFlag('feature-name')`), NEVER via raw env vars or constants.
- **Immutability**: Configuration objects MUST be `Readonly<T>` after initialization. NO runtime mutation of config values.

### MB.06 — Shared Component Blueprint (Design System)

Shared UI components (in `shared/components/`) MUST follow:

- **VK Prefix**: ALL shared components MUST use the `VK` prefix (e.g., `VKButton`, `VKCard`, `VKDialog`).
- **Prop Interface**: MUST extend native HTML element props where applicable (e.g., `interface VKButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`).
- **Variant System**: Use a variant-based API for styling (e.g., `variant="primary" | "secondary" | "ghost"`). Avoid arbitrary style props.
- **Accessibility**: ALL interactive components MUST meet WCAG 2.1 AA standards. Include proper ARIA attributes, keyboard navigation, and focus management.
- **Forward Ref**: ALL primitive components MUST use `React.forwardRef`.
- **Documentation**: Each shared component MUST include a JSDoc block describing its purpose, variants, and usage examples.
