---
name: vk-draft-rfc
description: Draft a top-down RFC proposal in docs/02-RFCs/ for a new package, complex UI/UX system, or architectural shift using docs/00-Blueprints/02-RfcBlueprint.md (PS.03).
---

# Skill: Draft Frontend RFC Proposal (`PS.03`)

Use this skill when proposing a new `@vk-blocks` package, complex UI/UX feature (streaming chat, virtualization, real-time collaboration), or major architectural shift before decomposing tasks into the backlog.

## Steps

1. **Bootstrap Context (`PS.04`)**:
   - If a target package path exists, call `vk_fe_get_module_context` on that directory.
   - Fetch architectural rules `PS.03, CS.01, AP.01, AP.02` via `vk_fe_get_architectural_rule`.

2. **Load the Single Source of Truth Blueprint**:
   - Read `docs/00-Blueprints/02-RfcBlueprint.md`.

3. **Determine Next RFC Number**:
   - List existing files in `docs/02-RFCs/` (or target package RFC directory) matching `NNN-*.md` and determine the next sequential 3-digit number (e.g., `017`).

4. **Generate & Save the RFC**:
   - Follow every section of `docs/00-Blueprints/02-RfcBlueprint.md` strictly:
     - Motivation & Problem Statement
     - Goals & Non-Goals (`BASE-06`)
     - Metaphor & Mapping (`PS.03`)
     - UI/UX Wireframe & 5-State Transition Matrix
     - Contract & Component Blueprint (`AP.01`, `AP.03`, `CS.01`)
     - Trade-offs, Bundle Budget, Server/Client boundary (`AP.02`), and a11y (`MB.06`)
     - Decomposition into atomic tasks for `vk_fe_add_backlog_item`
   - Save to `docs/02-RFCs/{NNN}-{kebab-case-slug}.md` (or package-scoped RFC folder).

