---
name: vk-generate-root-readme
description: Generate an evidence-based Japanese root README.md for the entire frontend monorepo using the RootReadMeGenerator.fe.md spec.
---

# Skill: Generate Frontend Monorepo Root README (`BASE-12`, `ARCH-04`)

## Goal

Generate an accurate, verifiable Japanese root README.md for the entire frontend repository, following `references/RootReadMeGenerator.fe.md`.
The root README acts as the gateway and map: helping readers understand what this framework is, what publishable packages exist, and how to navigate to each package's README.

## Steps

1. **Scan Monorepo Workspaces**:
   - Inspect `package.json` and `pnpm-workspace.yaml`.
   - List all packages under `packages/` that do NOT have `"private": true`.

2. **Load Rules & Reference Spec**:
   - Read `references/RootReadMeGenerator.fe.md` (or `.agents/skills/vk-generate-root-readme/references/RootReadMeGenerator.fe.md`).
   - Treat the spec as authoritative for structure, tone, and evidence rules.

3. **Collect Facts Across Packages**:
   - From each package's `package.json`: name, version, description, subpath exports, dependencies.
   - Read repository `LICENSE`, CI workflows, and `CHANGELOG.md`.

4. **Build Mermaid Dependency Map**:
   - Construct a layered Mermaid diagram reflecting actual `@vk-blocks/*` package dependencies without guesswork.

5. **Generate Root README**:
   - Write Japanese README (です・ます体) following `RootReadMeGenerator.fe.md`.
   - Technical terms and package names in English.

6. **Self-check**:
   - Ensure package list matches only publishable workspace packages.
   - Verify all links point to real files.

7. **Save and Report**:
   - If `README.md` exists, save to `README.generated.md` unless explicitly instructed to overwrite `README.md`.
   - Output summary of detected packages and missing README links.

