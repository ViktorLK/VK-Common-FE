---
name: vk-draft-impl-plan
description: Create a Contract-First implementation plan and specification (PS.01 audit, Monorepo package layout, CS.01 error matrix, Provider plan) using docs/00-Blueprints/Plan-ContractAndImplementationBlueprint.md.
---

# Skill: Draft Implementation Plan & Contract Specification (`BASE-01`, `PS.01`)

Use this skill before writing implementation code for a component, package, or refactoring task to lock down contracts, error codes, Monorepo file layout, and `PS.01` Architecture Decision Audit.

## Steps

1. **Bootstrap Context (`PS.04`)**:
   - Call `vk_fe_get_module_context` on `packages/{packageName}`.
   - Fetch architectural rules `PS.01, MB.01, MB.03, MB.06, CS.01, CS.03, AP.01, AP.03, AP.06, AP.07` via `vk_fe_get_architectural_rule`.

2. **Load the Single Source of Truth Blueprint**:
   - Read `docs/00-Blueprints/Plan-ContractAndImplementationBlueprint.md`.

3. **Produce the Specification**:
   - Output the complete specification following all 6 sections of `Plan-ContractAndImplementationBlueprint.md`:
     1. **Architectural Decision Audit (`PS.01`)**: Explicit Yes/No on ADR requirement.
     2. **Monorepo Package File Layout (`MB.01`, `AP.03`)**: `src/index.ts` public barrel vs `src/_internal/` isolation.
     3. **Contract-First Specifications (`BASE-01`, `CS.01`)**: Props interfaces, Zod schemas, Error Matrix, and 5-State Acceptance Matrix.
     4. **Provider Pattern & DI Configuration (`MB.03`, `AP.06`, `AP.07`)**: Fail-Fast hooks and non-intrusive persistence.
     5. **Non-Functional, Accessibility & Security Guardrails**: WCAG 2.1 AA, bundle budget, XSS defense.
     6. **Verification Checklist (`DL.02`)**: Typecheck, dependency-cruiser, API signatures.

