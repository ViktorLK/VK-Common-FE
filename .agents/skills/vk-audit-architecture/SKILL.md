---
name: vk-audit-architecture
description: Perform a deep, phased architecture audit on a specified frontend package and save a detailed report in docs/06-AuditReports/ using vk_fe_audit_architecture and docs/00-Blueprints/06-ArchitectureAuditBlueprint.md.
---

# Workflow: Full Frontend Architecture Audit (Phased Deep Analysis)

A comprehensive, multi-phase architecture audit that evaluates a frontend Monorepo package from boundary dependencies down to internal implementation details.

## Phase 0: Setup & Context

1. **Identify the Target**:
   - Determine the target package (e.g., `packages/ui`, `packages/auth`, or all packages).
   - If not specified, ask: `"Which package would you like me to full-audit?"`

2. **Bootstrap Context (`PS.04`)**:
   - Call `vk_fe_get_module_context(modulePath)`.
   - Top-up required rules via `vk_fe_get_architectural_rule`: `MB.01, AP.03, CS.02, OR.02, AP.05, AP.06, AP.07`.

3. **Load Blueprint**:
   - Read `docs/00-Blueprints/06-ArchitectureAuditBlueprint.md`.

4. **Prepare Report Path**:
   - Output: `docs/06-AuditReports/{packageName}/{packageName}_{YYYYMMDD}.md`.

## Phase 1: Structural Audit

- Execute `/vk-audit-fast` checks against the target package.
- Record all Fast Audit findings.

## Phase 2: Boundary & Dependency Audit (dependency-cruiser)

- Call `vk_fe_audit_architecture` from `vk-blocks-fe-manager` with `targetPackage`.
- Review dependency-cruiser output for:
  - Core purity violations (no UI/framework imports in Core).
  - Unidirectional layer compliance (Domain <- App <- Infra).
  - Internal import violations (no importing `_internal/` from outside).

## Phase 3: Implementation & DNA Audit

Evaluate against all dimensions defined in `06-ArchitectureAuditBlueprint.md`:
1. **TypeScript Strictness (`AP.01`)**: No `any`, no `!`, proper `vkAssert` boundary guards.
2. **Server / Client Boundary (`AP.02`)**: Proper RSC vs `"use client"` placement.
3. **Provider Pattern & Anti-Overprotection (`MB.03`, `AP.06`, `AP.07`)**: Fail-Fast context hooks, non-intrusive persistence.
4. **State Management (`AP.04`)**: Server vs Client state segregation.
5. **Result Pattern (`CS.01`)**: Typed `VKResult<T>` and centralized error constants.
6. **Accessibility & Design Standards (`MB.06`)**: WCAG 2.1 AA compliance, forwardRef, variants.

## Phase 4: Report Generation

1. Write the finalized report matching the Output Schema in `docs/00-Blueprints/06-ArchitectureAuditBlueprint.md`:
   - Language: Business IT Japanese (`BASE-09`).
   - Links: Repository-root-relative links (`[file.tsx](/packages/...)`).
2. Save to `docs/06-AuditReports/{packageName}/{packageName}_{YYYYMMDD}.md`.
3. Confirm completion and output summary.

