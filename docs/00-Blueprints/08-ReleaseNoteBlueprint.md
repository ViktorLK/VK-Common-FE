# Task: フロントエンド・パッケージリリースノートおよび移行ガイドの策定 (Frontend Release Notes Blueprint)

# Role

あなたは、`VK.Blocks` フロントエンドフレームワークのパッケージング整合性（`ARCH-04`）、最小公開面（`ARCH-07`）、および後方互換性ガバナンス（`FS-09`, `AP.03`）を統括するリリース・エンジニアリング・リードです。

# Goal

`@vk-blocks/*` npm パッケージまたは Monorepo 全体の新バージョン公開にあたり、下流アプリケーション開発者が安全かつ迅速にアップグレードできるよう、**変更分類（Additive / Breaking）**、**Public API / Props 差分**、**デザイン変数・Provider 移行手順** を明文化したリリースノートを作成します。

# Constraints & Language

1. **Breaking Change の厳格審査 (`ARCH-07`, `FS-09`)**:
   - Level 1 Public API（`VK` プレフィックスコンポーネント、フック、公開型）、Provider 階層、エラー定数、または CSS トークンの破壊的変更がある場合、必ず対応する ADR へのリンクを記載すること（`DL.03`, `PS.02`）。
2. **具体的な移行コード (`BASE-04`)**:
   - Props の変更や非推奨化（Deprecated）がある場合、抽象的な説明だけでなく、`Before` / `After` の TSX / CSS コードスニペットを必ず提示すること。
3. **出力言語**: ビジネスIT日本語（コード・識別子・見出しは英語併記、`BASE-09` 準拠）。

---

# Release Note & Upgrade Guide Structure (Must Follow)

```markdown
# 🚀 Release Notes: `@vk-blocks` v{Major}.{Minor}.{Patch} ({YYYY-MM-DD})

- **Release Type**: 🚨 Major (Breaking) / ✨ Minor (Additive) / 🐛 Patch (Bugfix & Perf)
- **Affected Packages**: `@vk-blocks/{pkgA}`, `@vk-blocks/{pkgB}`
- **Related ADRs / RFCs**: [Links to `docs/04-ArchitectureDecisionRecords/` or `N/A`]

---

## 1. 📌 Executive Summary (リリース概要)

- 本リリースにおける主要な価値提供（新コンポーネント、アクセシビリティ向上、バンドルサイズ削減など）を 2〜3 行で要約します。

---

## 2. ⚠️ Breaking Changes & Public API Impact (`ARCH-07`, `AP.03`, `FS-09`)

> 破壊的変更がない場合は「なし（No Breaking Changes — 完全な後方互換性を維持）」と明記してください。

| Package | Symbol / Component | Change Type | Rationale & ADR Reference |
| :--- | :--- | :---: | :--- |
| `@vk-blocks/ui` | `VKButton` Props | Prop Renamed | アクセシビリティ標準化（`loading` → `isLoading`）([ADR-022]) |
| `@vk-blocks/theme` | `--vk-color-primary` | Variable Renamed | 意味論トークンへの移行（`--vk-color-brand-default`） |

---

## 3. 🔄 Step-by-Step Upgrade & Migration Guide (移行手順書)

### 3.1 TSX Component & Hook Migration

```tsx
// ❌ Before (v{OldVersion})
<VKButton loading={true} onClick={handleClick}>
  Submit
</VKButton>

// ✅ After (v{NewVersion} - AP.01 Strict Props)
<VKButton isLoading={true} onClick={handleClick}>
  Submit
</VKButton>
```

### 3.2 Provider & Context Updates (`MB.03`, `AP.06`)

```tsx
// ❌ Before: 暗黙フォールバック
<VKAppLayout>{children}</VKAppLayout>

// ✅ After: 必須 Provider 包裹（Fail-Fast）
<VKThemeProvider theme="light">
  <VKAppLayout>{children}</VKAppLayout>
</VKThemeProvider>
```

### 3.3 CSS Variables & Theme Tokens

- CSS 変数の変更点と Tailwind 設定の更新差分。

---

## 4. ✨ New Features & Enhancements (新機能・改善項目)

- **`@vk-blocks/ui`**:
  - 新規コンポーネントの追加、WCAG 2.1 AA キーボード操作対応の強化。
- **`@vk-blocks/query`**:
  - TanStack Query v5 への最適化とストリーミング対応。

---

## 5. ⚡ Performance & Bundle Budget Delta (`CS.04`, `size-limit`)

| Package | Previous Size (Gzip) | New Size (Gzip) | Delta | Status |
| :--- | :---: | :---: | :---: | :---: |
| `@vk-blocks/ui` | `14.2 KB` | `13.5 KB` | `-0.7 KB (-4.9%)` | ✅ Improved |
| `@vk-blocks/core` | `3.1 KB` | `3.1 KB` | `0 KB` | ✅ Flat |

---

## 6. 🛡️ Pre-Release Verification Gate (`DL.02`, `pnpm check:all`)

- [ ] 型チェック通過: `pnpm typecheck` (`tsc --noEmit`) がエラー 0 件
- [ ] 依存境界検証: `pnpm check:architecture`（dependency-cruiser）が通過
- [ ] API 署名検証: `pnpm check:api` / `pnpm check:exports` が通過
- [ ] バンドル予算: `pnpm size:check` が全パッケージで制限内
- [ ] Public API / Props 変更に対する ADR が承認・リンクされていること
```

