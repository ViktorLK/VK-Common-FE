---
name: vk-code-normalization
description: Apply mechanical formatting and VK Frontend Industrial DNA standards to target files or packages.
---

# Workflow: Frontend Code Normalization (DNA Hardening)

Applies strict VK coding guidelines and mechanical cleanup to a target directory or file.

## Steps

1. **Identify Target & Load Context**:
   - Determine the target directory or file path within `packages/`.
   - Call `vk_fe_get_module_context(modulePath)`.
   - Fetch architectural rules `CS.01, CS.03, AP.01, CS.06, AP.03` via `vk_fe_get_architectural_rule`.

2. **Mechanical Cleanup (Stage 1)**:
   - Run linter auto-fix on the target package:
     ```powershell
     pnpm --filter @vk-blocks/{packageName} run lint --fix
     ```

3. **Semantic Normalization (Stage 2 — AI DNA Hardening)**:
   - **Type Safety (`AP.01`)**:
     - Eliminate all `any` in favor of `unknown` and type guards.
     - Eliminate all non-null assertions (`!`) in favor of `vkAssert` or optional chaining.
     - Add `as const` assertions to immutable objects/tuples.
     - Add `default: never` exhaustive checks to discriminated union switches.
   - **Boundary Defense**:
     - Ensure public functions check arguments with `vkAssert.notNull()`, `vkAssert.notEmpty()`.
   - **Result Pattern (`CS.01`)**:
     - Replace thrown business errors or bare nulls with `VKResult<T>` and centralized error constants.
   - **Logging (`OR.01`)**:
     - Replace bare `console.log()` with centralized logger.
   - **Naming & Export Hygiene (`AP.03`, `MB.02`)**:
     - Verify public symbols in `src/index.ts` use the `VK` prefix.
     - Verify internal symbols in `src/_internal/` do NOT use the `VK` prefix.

4. **Verification**:
   - Run typecheck: `pnpm --filter @vk-blocks/{packageName} run typecheck`.
   - Output summary of modifications and remaining debt.

