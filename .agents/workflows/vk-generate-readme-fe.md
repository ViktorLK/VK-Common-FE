---
description: Generate an evidence-based Japanese README.md for a single publishable frontend (npm) package using the ReadMeGenerator.fe.md spec.
---

## Goal

Generate an accurate, verifiable Japanese README.md for one frontend package (npm package in a React + TypeScript monorepo), following `prompts/CodeReview/ReadMeGenerator.fe.md`.
Every claim in the README must be traceable to the package's files. Unknowns are marked as TODO, never guessed.

## Steps

1. **Identify the Target Package**
   - Determine which package to generate the README for.
   - If the target is unclear, ask: `"Which package would you like me to generate a README for?"`
   - If its `package.json` has `"private": true`, the package is not published. Ask the user whether to proceed; if yes, omit install instructions and badges that imply publication.

2. **Load Rules**
   - Read `prompts/CodeReview/ReadMeGenerator.fe.md`.
   - Fill the Project Context placeholders: `{{PACKAGE}}` = package name, `{{PACKAGE_PATH}}` = package directory path.
   - Treat the spec as authoritative for structure, tone, and the evidence rules.

3. **Collect Facts in Layers** (do not read every source file blindly)
   - Read in this order and stop reading a layer once the facts for it are clear:
     1. Existing blueprint / design docs / ADRs related to the package
     2. `package.json`: `name`, `version`, `private`, `type`, `exports`, `main`/`module`/`types`, `sideEffects`, `files`, `peerDependencies`, `dependencies`, `engines`, `license`, `publishConfig`
     3. Public API surface: files referenced by `exports`, and the explicit exports in those entry files (never infer the API from directory structure alone)
     4. Provider props, configuration types, constants, theme tokens (CSS variables)
     5. Error types / codes, logger and trace interfaces
     6. Tests, stories, and examples (to confirm real usage); tool configs present in the package (vitest, playwright, storybook, size-limit, etc.)
     7. Implementation files, only to verify a specific claim
   - Also read: the repository root `LICENSE`, CI / publish workflow files, the `packageManager` field or lockfile (to know which package manager to show), `.changeset` configuration, and the existing README (if present).

4. **Build the Evidence Table** (internal, not part of the output)
   - Map each planned claim to a file or export: `claim → evidence`.
   - Drop any claim without evidence, or mark it as `<!-- TODO: 確認が必要 — ... -->`.
   - Record source conflicts (e.g. `license` field vs root `LICENSE`) as TODO items.
   - Decide which conditional sections to include or omit (スタイルのセットアップ / 設定 / コンポーネント一覧 / 設計判断 / バックエンド連携 / エラー・ログ・計測 / テストと品質 / 今後の展望).
   - Confirm publication evidence; without it, add the npm publication TODO and use placeholder badges.

5. **Generate the README**
   - Write the Japanese README (です・ます体) following the sections and rules in `ReadMeGenerator.fe.md`.
   - Code and code comments in English; package, component, hook, and API names kept in original English.
   - List peer dependencies explicitly; include required Providers and style setup in the quick-start example.
   - Include a Mermaid diagram only when the package has a non-trivial flow or layered structure.

6. **Self-check**
   - Run through the Self-check list in `ReadMeGenerator.fe.md`.
   - Verify that every import path in code samples exists in `exports`, and that component / hook / prop names exist in the source.
   - If the environment allows, write the quick-start sample to a temporary file and type-check it with the package's `tsconfig` (e.g. `tsc --noEmit`). Do not leave the temporary file in the repository. If it cannot be run, state that in the report.
   - Verify that no technology appears that the package does not actually use.
   - Fix issues before saving.

7. **Save and Report**
   - If `README.md` does not exist in the package root, save it as `README.md`.
   - If it already exists, do **not** overwrite: save to `README.generated.md` and tell the user to review the differences.
   - Report in this format:
     - ✅ README saved to `[path]`
     - TODO count: `[n]` (list each in one line)
     - Unverified or conflicting items: `[list, or "none"]`
     - Quick-start sample type-checked: `[yes / no — reason]`
     - Sections omitted for lack of facts: `[list, or "none"]`
