---
trigger: manual
---

# VK.Blocks FE: Architecture & Design Patterns (AP)

### AP.01 — Modern TypeScript Semantics

- **Strict Mode**: `tsconfig.json` MUST enable `strict: true`. NO relaxation of strict checks (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`) is permitted.
- **Immutable Data**: Use `as const` assertions, `Readonly<T>`, and `ReadonlyArray<T>` for data that should not be mutated. Prefer `interface` for object shapes and `type` for unions/intersections.
- **Discriminated Unions**: Use discriminated unions (tagged unions) for state modeling instead of optional properties or boolean flags (e.g., `type State = { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: VKError }`).
- **No `any`**: The use of `any` is STRICTLY PROHIBITED. Use `unknown` for truly unknown types and narrow with type guards. `Record<string, unknown>` over `Record<string, any>`.
- **No Non-Null Assertions**: The use of `!` (non-null assertion operator) is PROHIBITED except in test code. Use proper null checks or optional chaining (`?.`).
- **Const Enums / String Literals**: Prefer `as const` objects or string literal unions over TypeScript `enum`. Enums are permitted only for numeric flag-style values.
- **Exhaustive Checks**: ALL `switch` statements on discriminated unions MUST include a `default: never` exhaustive check (e.g., `const _exhaustive: never = value;`).
- **Defensive Programming (VKAssert)**:
    - **Mandatory Boundary Checks**: ALL public function boundaries MUST validate preconditions using a `vkAssert` / `vkGuard` utility.
    - Use `vkAssert.notNull(x)` for nullable values, `vkAssert.notEmpty(s)` for strings/arrays.
    - Manual `if (x == null) throw` patterns are PROHIBITED in favor of the centralized utility.

### AP.02 — Component Architecture

- **Server Components First**: Default to React Server Components (RSC). Only add `"use client"` when the component needs interactivity, browser APIs, or client-side state.
- **Composition over Props Drilling**: Prefer composition patterns (children, render props, compound components) over deeply nested prop chains (> 3 levels).
- **Single Responsibility**: Each component file MUST contain ONE primary component. Internal sub-components MAY be defined in the same file ONLY if they are exclusively used by the parent.
- **Prop Types**: ALL component props MUST be defined as a named TypeScript `interface` or `type` (e.g., `interface ButtonProps { ... }`). NO inline object types in function signatures.
- **Controlled Components**: Form inputs MUST be controlled by default. Uncontrolled refs are allowed only for performance-critical scenarios with explicit justification.
- **Forward Ref**: Reusable UI primitive components (Button, Input, etc.) MUST use `React.forwardRef` to enable ref forwarding.

### AP.03 — Structural Organization

#### Semantic Visibility & Naming Convention

- **Public API Surface (`index.ts` barrel exports)**:
    - **Location**: Each feature module MUST expose its public API through an `index.ts` barrel file.
    - **Naming**: Public types/components MUST use the `VK` prefix (e.g., `VKButton`, `VKAuthProvider`, `VKUseAuth`).
    - **Restriction**: ONLY types, components, and hooks intended for cross-module consumption are exported.
- **Internal Scoping (`_internal/` or `internal/`)**:
    - **Location**: Implementation details within a feature module.
    - **Naming**: MUST **NOT use the `VK` prefix**.
    - **Enforcement**: Internal modules MUST NOT be imported from outside their parent feature module. Enforce via ESLint `import/no-restricted-paths` or similar.
- **Shared Utilities (`shared/` or `common/`)**:
    - **Location**: Cross-cutting utilities shared across multiple feature modules.
    - **Visibility**: Exported via barrel files. Use `VK` prefix for public shared utilities.
- **NO Type-Driven Folders**: Avoid grouping by technical type at the root level.
  ✅ `features/auth/`, `features/dashboard/`
  ❌ `components/`, `hooks/`, `utils/` (at root level for feature-specific code)

#### Implementation Naming Taxonomy

For service/utility implementations, use these semantic prefixes:

| Prefix | Description | Engineering Intent |
| :--- | :--- | :--- |
| **`Default`** | Production-grade implementation | **The Official Recommendation**. Standard, production-ready implementation. |
| **`Basic`** | Simple/in-memory implementation | **Foundational / Lightweight**. Suitable for prototyping or simple use cases. |
| **`NoOp`** | Returns immediately with no effect | **Graceful Disablement**. Feature is toggled off but dependencies remain stable. |
| **`Mock`** | Test-only implementation | **Testing**. Used exclusively in test environments for deterministic behavior. |
| **`{Vendor}`** (e.g., `Stripe`, `Firebase`) | Vendor-coupled implementation | **External Coupling**. Tied to an external SDK. Must be swappable via interfaces. |

#### Constant Visibility

- **Single File Scope**: Use `const` within the module.
- **Cross-file (Same Feature)**: Extract to a `constants.ts` file within the feature folder.
- **Cross-feature (Global)**: Extract to a shared `constants/` directory at the project root.
- ALWAYS eliminate magic strings and numbers using this visibility hierarchy.
- Constants files MUST be named after their scope:
  ✅ `workingHoursConstants.ts`
  ❌ `constants.ts` (generic, unnamed)

#### Type Segregation

- **One File, One Primary Export**: NEVER declare multiple primary exported components, hooks, or service classes in a single file.
- **Colocated Types**: Types that are exclusively used by a single component/module MAY be defined in the same file.
- **Shared Types**: Types used across multiple modules MUST be extracted to a dedicated `types.ts` file within the appropriate scope.

### AP.04 — State Management Policy

- **Server State**: Use a data-fetching library (e.g., TanStack Query, SWR, or RSC) for ALL server state. NEVER use client-side state (useState/useReducer/Zustand) for caching server data.
- **Client State**: Use React's built-in state (useState, useReducer, useContext) for local UI state. Only introduce external state management (Zustand, Jotai) when state is shared across multiple unrelated components.
- **URL State**: Prefer URL search params for filterable/shareable state (e.g., search queries, pagination, filters). Use `useSearchParams` / `nuqs` for type-safe URL state.
- **Form State**: Use a dedicated form library (React Hook Form + Zod) for complex forms. Simple forms (1-3 fields) MAY use controlled state.
- **NO Global Mutable State**: NEVER use module-level mutable variables (`let` at file scope) for state management. ALL state MUST flow through React's state model or a dedicated store.

### AP.05 — API Integration Contract

- **Type-Safe Clients**: ALL API calls MUST go through a typed client layer. NO raw `fetch()` calls in components.
- **Request/Response Types**: ALL API endpoints MUST have TypeScript types for both request and response shapes.
- **Error Mapping**: API errors MUST be mapped to domain-level `VKError` objects at the client boundary. Components MUST NOT handle raw HTTP errors.
- **Versioning**: API client modules MUST be version-aware. Breaking API changes REQUIRE an ADR (DL.03).
- **Schema Validation**: ALL API responses SHOULD be validated against a Zod schema at the boundary. Trust but verify.
