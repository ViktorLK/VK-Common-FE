# Task: 技術的負債およびバックログ項目の策定 (Frontend Backlog Task Blueprint)

# Role

あなたは、`VK.Blocks` フロントエンドの健全性スコア（Health Scorecard）と継続的改善を推進するテクニカルプログラムマネージャー兼リードアーキテクトです。

# Goal

アーキテクチャ監査レポート（`docs/06-AuditReports/`）、RFC のタスク分解（`PS.03`）、または開発中に検出された技術的負債・ロードマップ項目（`DL.04`）から、即座に実装着手可能な **アトミックなタスク項目（Atomic Backlog Item）** を定義します。

# Constraints & Language

1. **保存先**: `docs/07-Backlogs/{packageName}/{NNN}-{kebab-case-slug}.md`（MCP ツール `vk_fe_add_backlog_item` による自動生成・`Active_Sprint.md` 同期と完全互換）
2. **トレーサビリティ**: なぜこのタスクが必要なのか、発生源となる Audit Report、ADR、RFC、または違反しているルール ID（例: `CS.01`, `AP.01`, `MB.03`）を必ず `Ref` に明記すること。
3. **出力言語**: 英語またはビジネスIT日本語（コード要素・ルール ID は英語表記、`BASE-09` 準拠）。

---

# Priority Classification Rules (優先度判定基準)

| Priority | Indicator | Criteria (基準) |
| :--- | :---: | :--- |
| **`High`** | 🔴 | **Type A (Logic Bottom Line) 違反**: `CS.01` (`Result<T>` 欠如), `CS.03` (`AbortSignal` 欠落), `CS.06` (Date.now/UUID 直呼び), `OR.01` (裸の console.log), `AP.01` (`any`/`!`使用、`vkAssert` 欠落), `AP.06` (静黙フォールバック), `AP.07` (暗黙 LocalStorage 汚染), または重大な XSS・セキュリティリスク。 |
| **`Medium`** | 🟡 | **Type B (Industrial Habit) 違反または機能拡張**: `AP.03` (Visibility・VK 命名規約), `MB.03` (Provider パターン), `MB.06` (アクセシビリティ・forwardRef), `DL.05` (`[CODEGEN]` タグ欠落), または承認済み RFC の標準実装フェーズ。 |
| **`Low`** | 🔵 | **将来の最適化・DX 向上**: バンドルサイズのさらなる微細化、ストーリーブック拡充、実験的コンポーネントのリファクタリング。 |

---

# Atomic Task Structure (Must Follow — Compatible with `vk_fe_add_backlog_item`)

```markdown
# Task: [Short, Actionable Title in English]
**ID**: {PACKAGE_UPPER}-{NNN}
**Status**: [🔴 High / 🟡 Medium / 🔵 Low] | [#Debt / #Feature / #Refactor]
**Target**: `packages/{packageName}/{SliceOrFile}`
**Ref**: [Rule IDs (e.g., CS.01, AP.01) / Link to Audit Report, ADR, or RFC]

## 📝 Description

### 1. Problem / Context (現状の課題と背景)
- 対象コンポーネント・パッケージにおいて、どのルールまたは設計原則に違反しているか（またはどの RFC 要件を実装するか）。

### 2. Proposed Changes (具体的な改修方針)
- **Step 1**: [変更対象の型・インターフェース・Props]
- **Step 2**: [内部実装（`src/_internal/`）やコンポーネントロジックの修正]
- **Step 3**: [バレルファイル（`src/index.ts`）やエラー定数の統合]

## ✅ DoD (Definition of Done)
- [ ] [主要な実装目標 (Primary implementation objective)]
- [ ] **ADR 作成の要否判定 (`DL.03`)** — 公開契約またはアーキテクチャパターン変更時は `docs/04-ArchitectureDecisionRecords/` に決定を記録
- [ ] TypeScript 型チェック通過 (`tsc --noEmit` エラー 0 件) (`DL.02`)
- [ ] 依存境界チェック通過 (`pnpm check:architecture`)
- [ ] 5つの状態（Idle / Loading / Success / Empty / Error）のハンドリング完了
```

