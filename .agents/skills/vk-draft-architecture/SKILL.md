---
name: vk-draft-architecture
description: Generate or update package architecture specifications and system boundary diagrams in docs/03-Architecture/ using 03-ArchitectureBlueprint.md and docs/03-Architecture/README.md (BASE-12, ARCH-01).
---

# Skill: Draft Frontend Architecture Specification (`BASE-12`, `ARCH-01`)

Use this skill when introducing a new package into the Monorepo or documenting the boundary principles, layer dependencies (L0 Core -> L1 UI Primitives -> L2 Domain Blocks -> L3 Applications), and Mermaid dataflow sequences.

## Steps

1. **Bootstrap Context (`PS.04`)**:
   - Call `vk_fe_get_module_context` on `packages/{packageName}`.
   - Fetch architectural rules `ARCH-01, ARCH-02, MB.01, AP.03` via `vk_fe_get_architectural_rule`.

2. **Load the Architecture Specifications**:
   - Read `docs/00-Blueprints/03-ArchitectureBlueprint.md` and global architecture baseline `docs/03-Architecture/README.md`.

3. **Generate & Save Artifacts**:
   - Create or update architecture documentation in `docs/03-Architecture/{packageName}/` (Package Context, Layer Flow, Component Hierarchy, and External Integration).
   - Ensure layer boundaries align with `.dependency-cruiser.cjs` rules.
