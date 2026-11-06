# Task: RFC 提案書および概念設計の策定 (Frontend RFC Proposal Blueprint)

# Role

あなたは、React / Next.js、TypeScript Strict、モダンフロントエンドアーキテクチャ（Server Components、Monorepo パッケージ設計、WCAG アクセシビリティ、Result パターン）に精通したプリンシパル・フロントエンドアーキテクトです。

# Goal

新しいパッケージ（`@vk-blocks/*`）、複雑な UI/UX 機能スライス（リアルタイムコラボレーション、仮想化データグリッド、AI チャットストリーミング、複雑な状態遷移マシンなど）、または破壊的変更を伴う設計刷新について、実装やバックログ分解に入る前の **Top-Down 概念設計（RFC: Request for Comments）** を策定します（`PS.03` 準拠）。

# Constraints & Language

1. **保存先**: `docs/02-RFCs/{NNN}-{kebab-case-slug}.md`
2. **出力言語**: ビジネスIT日本語（見出しおよび技術識別子は英語併記、`BASE-09` 準拠）
3. **過剰設計の排除 (`BASE-06`)**: 具体的なコンシューマ（利用パッケージや UI 画面）が存在しない抽象化やオプションの追加は厳禁とし、必ず `Non-Goals`（スコープ外）を明記すること。
4. **UI/UX 状態とアクセシビリティの明記**: UI コンポーネントを含む場合、状態遷移（Idle/Loading/Success/Empty/Error）と WCAG 2.1 AA 要件を必ず含めること。

---

# RFC Structure (Must Follow)

```markdown
# RFC-{NNN}: [Title in English]

- **Status**: 📝 Draft / 🔍 Review / ✅ Approved / 🛑 Rejected
- **Author**: [Author / Frontend Architecture Team]
- **Date**: YYYY-MM-DD
- **Target Package(s)**: `@vk-blocks/{packageName}`
- **Related ADRs / RFCs**: [Links or N/A]

---

## 1. 🎯 Motivation & Problem Statement (背景と課題定義)

- **現状の課題 (Current Pain Points)**: 既存のコンポーネントやパッケージで解決できない課題、または新たに発生した要件は何か。
- **なぜ今やるのか (Why Now / Consumer)**: この機能を必要としている具体的なコンシューマ（利用画面または別パッケージ — `BASE-06`）はどこか。

## 2. 🧭 Goals & Non-Goals (目標と非目標)

- **Goals (達成すべき目標)**:
  - 本 RFC で実現する明確な境界と成果物（新規コンポーネント、フック、パッケージ）。
- **Non-Goals (スコープ外 — `BASE-06` 準拠)**:
  - 意図的に実装しない機能、将来のフェーズに委ねる拡張点（YAGNI の徹底）。

## 3. 🧬 Metaphor & Mapping (メンタルモデルと構造マッピング — `PS.03`)

> 複雑な UI 相互作用や状態遷移を直感的に共有するための比喩モデル（物理的・視覚的モデル）と、コード要素への対応表を定義します。

- **Metaphor (概念メタファー / メンタルモデル)**: [1〜2段落で直感的な比喩モデルを解説]

| Metaphor Component (概念要素) | Technical Artifact (技術要素) | Layer / Scope | Responsibility (責務) |
| :--- | :--- | :--- | :--- |
| 例: Stage Manager (舞台監督) | `VKChatStreamProvider` | Context / Provider | ストリームイベントの調停と購読管理 |
| 例: Actor (役者) | `VKMessageBubble` | Component (`components/`) | メッセージとレンダリングの純粋描画 |
| 例: Script (台本) | `VKChatSchema` | Zod Schema (`schemas/`) | 入出力の不変条件検証 |

## 4. 🎨 UI/UX Wireframe & State Machine (UX 画面遷移と状態モデル)

### 4.1 Visual Wireframe / Component Anatomy
```text
+-------------------------------------------------------------+
| [Header] VKChatHeader (Title, Status Indicator)            |
+-------------------------------------------------------------+
| [Body]   VKMessageList (Virtualized scroll container)       |
|          - User Bubble (right-aligned)                      |
|          - Assistant Bubble (left-aligned, streaming cursor)|
+-------------------------------------------------------------+
| [Footer] VKChatInputBar (Textarea, Send button, Attachments)|
+-------------------------------------------------------------+
```

### 4.2 State Transition Matrix
- **Idle**: 初期待機状態
- **Loading / Connecting**: 接続確立中（スケルトンまたはスピナー表示）
- **Streaming / Interactive**: 増分レンダリングと対話受付中
- **Empty**: データなしプレースホルダー
- **Error**: リカバリボタン付きエラーバウンダリ表示

## 5. 🏗️ Contract & Code Blueprint (契約と主要インターフェース設計 — `BASE-01`)

### 5.1 Public Component / Hook Interfaces (`src/index.ts`)
```typescript
// Public Contract (AP.01 Strict, AP.03 VK prefix)
export interface VKChatProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly sessionId: string;
  readonly onMessageSent?: (message: VKChatMessage) => void;
  readonly fallbackErrorNode?: React.ReactNode;
}

export function VKChat(props: VKChatProps): React.JSX.Element;
```

### 5.2 Error Contract (`errors.ts`)
- `{Module}.{Category}.{Reason}` 形式のエラーコード定義案（`CS.01`, `FS-02`）。

## 6. ⚖️ Trade-offs, Performance & Accessibility

- **Server vs Client Boundary (`AP.02`)**: RSC と `"use client"` の境界設定と根拠。
- **Bundle Budget & Tree-Shaking**: 依存ライブラリのサイズインパクトとバンドル予算。
- **Accessibility (a11y — `MB.06`)**: キーボードナビゲーション、ARIA 属性、フォーカス制御。

## 7. 📋 Decomposition & Implementation Plan (バックログ分解計画)

> RFC が `✅ Approved` となった後、`vk_fe_add_backlog_item` を通じて `docs/07-Backlogs/` に起票するアトミックなタスク群：

- [ ] **Phase 1 (Contracts & Types)**: Public インターフェース、型定義、Zod スキーマ、Error 定数
- [ ] **Phase 2 (Core Components & Hooks)**: 内部実装（`_internal/`）および UI プリミティブ構築
- [ ] **Phase 3 (Accessibility & Resilience)**: a11y 検証、Error Boundary 統合、サイズ制限検証
```

