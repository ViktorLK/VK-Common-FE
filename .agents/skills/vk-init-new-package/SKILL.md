---
name: vk-init-new-package
description: Initialize a new compliant Monorepo package under packages/{name} using vk_fe_draft_package_boilerplate or @vk-blocks/cli (ARCH-04, MB.01).
---

# Skill: Initialize New Monorepo Package (`ARCH-04`, `MB.01`)

Use this skill when bootstrapping a new package under `packages/` to ensure full compliance with Monorepo standards, barrel export contracts, TypeScript configurations, and `_internal/` scoping.

## Steps

1. **Confirm Package Justification (`ARCH-04`)**:
   - Verify that the package represents an independently publishable module or a distinct physical dependency boundary.

2. **Invoke Deterministic Scaffolding Tool**:
   - Option A (MCP Tool): Call `vk_fe_draft_package_boilerplate` from `vk-blocks-fe-manager` with:
     - `packageName`: Short name or scoped name (e.g. `"worker"` or `"@vk-blocks/worker"`).
     - `description`: English description of the package's responsibility.
     - `dependencies`: Array of internal dependencies (e.g. `["core", "theme"]`).
   - Option B (Official CLI): Run `node tools/cli/src/cli.mjs create-package <name>`.

3. **Verify Scaffolded Artifacts**:
   - `packages/{packageName}/package.json`: correct name, exports, peerDependencies.
   - `packages/{packageName}/tsconfig.json`: extends `@vk-blocks/tsconfig`.
   - `packages/{packageName}/src/index.ts`: public barrel file with explicit exports.
   - `packages/{packageName}/src/_internal/`: isolated directory for private logic.

4. **Register in Monorepo**:
   - Run `pnpm install` at workspace root to link workspace dependencies.
   - Verify architecture boundary with `pnpm check:architecture`.

