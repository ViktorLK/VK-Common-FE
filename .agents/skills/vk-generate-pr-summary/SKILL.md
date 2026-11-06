---
name: vk-generate-pr-summary
description: Analyze git diff and generate a professional Pull Request summary in Markdown aligned with .github/PULL_REQUEST_TEMPLATE.md.
---

## Goal

Read the uncommitted changes (or changes between specific branches) using `git diff` and generate a highly professional, well-structured Pull Request description in Business IT Japanese (ビジネスIT日本語) highlighting alignment with VK Frontend Industrial DNA, fully adhering to `.github/PULL_REQUEST_TEMPLATE.md`.

## Steps

1. **Read Changes via Tool**:
   - Execute `git diff` (or `git diff --cached` if files are staged) in the project workspace to understand exactly what was changed.
   - If the user provides a branch name, compare it against `main` or the base branch.

2. **Analyze the Diff**:
   - Understand the _purpose_ behind the code modifications.
   - Cross-reference the changes with `l3-vk-fe.md` rules:
     - `CS.01` (Result<T> pattern, centralized error codes)
     - `CS.03` (AbortSignal propagation)
     - `CS.06` (Centralized Clock / ID abstraction)
     - `OR.01` (Centralized Logger, no raw console.log)
     - `AP.01` (TypeScript Strict, vkAssert, no `any` / `!`)
     - `AP.03` (VK prefix for public exports, _internal/ scoping)
     - `AP.06` (Fail-Fast Providers, anti-overprotection)
     - `AP.07` (Non-intrusive capability boundary)
     - `MB.01 - MB.06` (Monorepo package structure, clean barrels)

3. **Generate Markdown Summary**:
   - Follow the structure defined in `.github/PULL_REQUEST_TEMPLATE.md`:

   ```markdown
   ## 🎯 目的 (Goal / Context)

   [Why this PR exists. What problem does it solve? Link to Backlog Item / RFC / Issue]
   - Ref: docs/07-Backlogs/{packageName}/{NNN}-{slug}.md

   ## 🛠️ 変更概要 (Summary of Changes)

   - [Package/Component 1]: [Brief explanation of what changed]
   - [Package/Component 2]: [Brief explanation of what changed]

   ## 🛡️ アーキテクチャ・品質チェック (Architectural Compliance)

   - [x] **Result Pattern (`CS.01`, `BASE-05`)**: [Did we apply Result<T> properly?]
   - [x] **Contract & Boundaries (`BASE-01`, `AP.03`, `ARCH-07`)**: [Are public surfaces minimal with VK prefix?]
   - [x] **Async Hygiene (`CS.03`)**: [Is AbortSignal propagated?]
   - [x] **Deterministic Dependencies (`CS.06`, `BASE-02`)**: [Are injected clock/ID generators used?]
   - [x] **Anti-Overprotection (`AP.06`, `AP.07`)**: [Are provider configurations explicit and fail-fast?]

   ## ⚠️ 契約変更・ADR アラート (Contract & Architecture Alert)

   - [ ] 公開契約（Public API / Props / Export / Schema / Options）の変更有無:
     - [ ] 変更なし (No Breaking Change)
     - [ ] 変更あり ➔ `docs/04-ArchitectureDecisionRecords/{packageName}/` に ADR を作成・更新済み (`DL.03`, `PS.01`)

   ## ✅ Definition of Done (DoD) - 完了条件チェックリスト

   - [ ] **Typecheck & Lint Free (`DL.02`, `BASE-03`)**: 型チェックおよびリント警告ゼロ (`pnpm typecheck`, `pnpm lint`)
   - [ ] **Build Success (`BASE-07`)**: ビルドが通る (`pnpm build`)
   - [ ] **Boundary Verification (`ARCH-01`, `MB.01`)**: 依存関係・レイヤー境界検証がパス (`pnpm check:architecture`)
   - [ ] **No Naked TODO (`BASE-07`)**: 未解決の裸の `// TODO` が存在しない（条件付き `TODO[condition]` または Backlog 起票 `DL.04`）
   - [ ] **Documentation (`BASE-11`, `BASE-12`)**: 必要なドキュメントが同期され、内部リンクはルート相対パス（`/docs/`, `/packages/`）に準拠
   ```

4. **Output Format**:
   - Do NOT save this to a file.
   - Print the generated Markdown directly into the chat inside a `markdown` block so the user can easily copy and paste it into GitHub.

