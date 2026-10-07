---
description: Generate an evidence-based Japanese root README.md for a multi-package frontend (npm monorepo) using the RootReadMeGenerator.fe.md spec.
---

## Goal

Generate an accurate, navigation-oriented Japanese README.md at the repository root of a multi-package React + TypeScript monorepo, following `prompts/CodeReview/RootReadMeGenerator.fe.md`.
Facts (package list, versions, dependencies, peer ranges) come from `package.json` files. Narrative content (principles, non-goals) comes from existing documents only. Unknowns are marked as TODO, never guessed.

This workflow should run **after** package-level READMEs have been generated with `/vk-generate-readme-fe`.

## Steps

1. **Confirm the Repository and Check Prerequisites**
   - Identify the repository root. If unclear, ask: `"Which repository root would you like me to generate a README for?"`
   - Read the workspace definition (`pnpm-workspace.yaml` or the `workspaces` field in the root `package.json`) and enumerate every workspace package.
   - Separate packages into published candidates (no `"private": true`) and private ones. Only the former are listed in the README.
   - Check which published candidates already have a `README.md` in their directory.
   - If many are missing, tell the user and suggest running `/vk-generate-readme-fe` for them first. Continue only if the user confirms; missing ones will appear as TODO rows.

2. **Load Rules**
   - Read `prompts/CodeReview/RootReadMeGenerator.fe.md`.
   - Fill the Project Context placeholder: `{{REPO_ROOT}}` = repository root path.
   - Treat the spec as authoritative for structure, tone, and evidence rules.

3. **Collect Package Facts and Build the Dependency Graph** (from `package.json` only)
   - For each published candidate, collect: `name`, `version`, `description`, `exports` keys (subpaths), `peerDependencies`, `engines`, and references to other internal packages in `dependencies` / `peerDependencies` (e.g. `workspace:*`).
   - Edges to private packages are not drawn; record them as a note in the report.
   - Group packages by domain (derive grouping from package naming or directory structure; if ambiguous, record a TODO instead of inventing groups).
   - Packages with multiple subpaths occupy a single row; put the main subpaths in the notes column.
   - Do not take dependency or version facts from README text.

4. **Collect Narrative and Supporting Facts**
   - Read, if present: blueprint / design docs / ADRs / `docs/`, the existing root README, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`, `.changeset` configuration, CI / publish / Storybook-deploy workflow files, root `package.json` `scripts`, and any roadmap or backlog document.
   - From each package README, read only the introduction (「はじめに」) to get the one-line purpose; do not copy details.
   - Count the `TODO:` markers in each package README for the final report. Do not carry them into the root README.

5. **Determine Status Facts and Optional Columns / Sections**
   - **Publication status**: use "公開済み"-type wording only with publish evidence (publish workflow, `publishConfig`, changeset publish config). Otherwise write "公開可能" and add the npm publication TODO.
   - **Stability column**: include only if an explicit source exists (documentation, metadata, or a list the user provides). Show version numbers as facts; never convert them into stability labels. If no source is found, omit the column and mention it in the report.
   - **Versioning policy**: describe only what `.changeset` (or equivalent) configuration explicitly states.
   - Decide for each conditional section (設計原則 / パッケージの選び方 / クイックスタート / 開発環境 / 今後の展望) whether enough evidence exists. Omit the section if not.

6. **Build the Evidence Table** (internal, not part of the output)
   - Map each planned claim to a file: `claim → evidence`.
   - Drop claims without evidence, or mark them as `<!-- TODO: 確認が必要 — ... -->`.
   - Record conflicts (e.g. a package README that disagrees with its `package.json`) as TODO items.

7. **Generate the README**
   - Write the Japanese README (です・ます体) following the sections and rules in `RootReadMeGenerator.fe.md`.
   - Build the Mermaid architecture diagram only from existing internal-package references; group by `subgraph` when there are many packages. If peer edges are drawn, use dashed lines and explain them in a legend.
   - Link each package row to its README; leave a TODO where the README is missing.

8. **Self-check**
   - Run through the Self-check list in `RootReadMeGenerator.fe.md`.
   - Verify that the package table equals the set of non-private workspace packages exactly (no missing, no extra, no private packages).
   - Verify that every Mermaid edge exists as an internal-package reference in a `package.json`.
   - Verify that every link points to an existing file.
   - Fix issues before saving.

9. **Save and Report**
   - If `README.md` does not exist at the repository root, save it as `README.md`.
   - If it already exists, do **not** overwrite: save to `README.generated.md` and tell the user to review the differences.
   - Report in this format:
     - ✅ README saved to `[path]`
     - Packages listed: `[n]`; private packages excluded: `[n]`; packages without a README: `[list, or "none"]`
     - Publication evidence found: `[yes / no]`
     - TODO count in the root README: `[n]` (list each in one line)
     - Total TODOs remaining in package READMEs: `[n]`
     - Conflicts found between sources: `[list, or "none"]`
     - Sections or columns omitted for lack of facts: `[list, or "none"]`

## Maintenance Note

The package table and architecture diagram go stale when packages are added, removed, re-referenced, or when a package's `private` flag changes. Re-run this workflow after such changes, and review the diff against the existing README before replacing it.
