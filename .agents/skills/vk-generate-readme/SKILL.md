---
name: vk-generate-readme
description: Generate an evidence-based Japanese README.md for a single publishable frontend (npm) package using the ReadMeGenerator.fe.md spec.
---

# Skill: Generate Frontend Package README (`BASE-12`, `ARCH-07`)

## Goal

Generate an accurate, verifiable Japanese README.md for one frontend package (npm package in a React + TypeScript monorepo), following `references/ReadMeGenerator.fe.md`.
Every claim in the README must be traceable to the package's files. Unknowns are marked as TODO, never guessed.

## Steps

1. **Identify the Target Package**:
   - Determine which package to generate the README for (`packages/{packageName}`).
   - If the target is unclear, ask: `"Which package would you like me to generate a README for?"`
   - If its `package.json` has `"private": true`, ask the user whether to proceed; if yes, omit installation commands.

2. **Load Rules & Reference Spec**:
   - Read `references/ReadMeGenerator.fe.md` (or `.agents/skills/vk-generate-readme/references/ReadMeGenerator.fe.md`).
   - Treat the spec as authoritative for structure, tone, and evidence rules.

3. **Collect Facts in Layers**:
   - Read in this order and stop reading once clear:
     1. Existing manifest / design docs / ADRs related to the package
     2. `package.json`: `name`, `version`, `private`, `type`, `exports`, `peerDependencies`, `dependencies`, `license`
     3. Public API surface: files referenced by `exports` (`src/index.ts`)
     4. Provider props, configuration types, constants, theme tokens
     5. Error types / codes, diagnostics tokens
     6. Implementation files, only to verify a specific claim

4. **Build the Evidence Table** (internal, not part of the output):
   - Map each planned claim to a file or export: `claim → evidence`.
   - Drop any claim without evidence, or mark it as `<!-- TODO: 確認が必要 — ... -->`.

5. **Generate the README**:
   - Write Japanese README (です・ます体) following `ReadMeGenerator.fe.md`.
   - Code and comments in English; names kept in original English.
   - Include a Mermaid diagram only when the package has a non-trivial flow or layered structure.

6. **Self-check**:
   - Run through the Self-check list in `ReadMeGenerator.fe.md`.
   - Verify every import path exists in `exports`.

7. **Save and Report**:
   - If `README.md` does not exist in the package root, save it as `README.md`.
   - If it already exists, do **not** overwrite: save to `README.generated.md` and tell the user to review the differences.
   - Report: path, TODO count, unverified items, and quick-start check status.

