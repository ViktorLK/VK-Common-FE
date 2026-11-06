---
name: vk-audit-semantic
description: Verify semantic compliance with VK Industrial DNA (Result<T>, AbortSignal, vkAssert, Error constants, Logger, Anti-overprotection). Output is inline.
---

# Workflow: Semantic Industrial DNA Audit

Evaluates source files within a target package or directory against VK Industrial DNA core bottom lines (Type A rules: `CS.01`, `CS.03`, `CS.06`, `OR.01`, `AP.01`, `AP.06`, `AP.07`).

## Steps

1. **Identify Target & Load Rules**:
   - Determine target package or directory.
   - Fetch architectural rules `CS.01, CS.03, AP.01, CS.06, OR.01, AP.06, AP.07` via `vk_fe_get_architectural_rule`.

2. **Evaluate Semantic Dimensions**:
   - **Result Pattern (`CS.01`)**: All service/API boundary operations return `VKResult<T>`. No raw null returns, no exceptions as control flow.
   - **Cancellation (`CS.03`)**: All asynchronous data-fetching hooks and functions accept and forward `AbortSignal`.
   - **Centralized Abstractions (`CS.06`)**: No direct `Date.now()` or `crypto.randomUUID()` in domain logic; use injected abstractions.
   - **Centralized Logging (`OR.01`)**: No raw `console.log()` in production code. Structured metadata with traceId.
   - **Boundary Defense (`AP.01`)**: Preconditions verified with `vkAssert` at function entry points.
   - **Anti-Overprotection (`AP.06`)**: Context hooks fail fast when provider is absent; no silent dummy fallbacks.
   - **Persistence Boundary (`AP.07`)**: Core packages do not silently write to `localStorage` without explicit configuration.

3. **Output Summary**:
   - Return structured findings directly in the chat with line links.
   - Declare: `Audit: ✅` or `Audit: 🚩 [RuleID] {Rationale}`.

