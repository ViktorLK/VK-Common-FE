---
name: vk-draft-adr
description: Generate an Architecture Decision Record (ADR) and update the ADR index in docs/04-ArchitectureDecisionRecords/{packageName}/ using vk_fe_draft_adr and docs/00-Blueprints/04-AdrBlueprint.md (DL.03, PS.02).
---

# Skill: Draft Architecture Decision Record (`DL.03`, `PS.02`)

Use this skill whenever an architectural decision point is reached (new shared interface, pattern change, state management shift, trade-off resolution) to record an ADR in `docs/04-ArchitectureDecisionRecords/{packageName}/`.

## Steps

1. **Bootstrap Context (`PS.04`)**:
   - Call `vk_fe_get_module_context` on the target package directory (e.g., `packages/{packageName}`).
   - Fetch architectural rules `PS.01, PS.02, DL.03` via `vk_fe_get_architectural_rule`.

2. **Prepare ADR Analysis & Invoke Deterministic MCP Tool**:
   - Synthesize the architectural decision parameters:
     - `title`: Concise, decisive English title (e.g. `Adopt Radix Primitives and Strict Composition`).
     - `context`: Background context, triggers, and problem statement.
     - `decision`: Concrete decision, patterns, component/provider contracts, and code design.
     - `consequences`: (Optional) Positive benefits, negative trade-offs, and mitigations.
   - Call `vk_fe_draft_adr` from `vk-blocks-fe-manager`.
   - The MCP tool deterministically:
     - Computes the next sequential `adr-{NNN}` number and safe kebab-case filename.
     - Writes the finalized ADR markdown to `docs/04-ArchitectureDecisionRecords/{packageName}/adr-{NNN}-{slug}.md`.
     - Automatically indexes the decision and recalculates metrics in `docs/04-ArchitectureDecisionRecords/{packageName}/README.md` and root `docs/04-ArchitectureDecisionRecords/README.md`.

3. **Verify and Report**:
   - Confirm the returned file path and index update status.
   - Report the published ADR to the user with link and decision highlights.

