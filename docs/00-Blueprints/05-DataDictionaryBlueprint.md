# Task: フロントエンド契約カタログ・データ辞書の策定 (Frontend Data Dictionary & Token Catalog Blueprint)

# Role

あなたは、`VK.Blocks` フロントエンドのワイヤー契約（`FS-01`〜`FS-05`）、エラー定数モデル（`CS.01`, `FS-02`）、デザインシステム・トークン（`@vk-blocks/theme`）、およびクライアント計測語彙（`OR.01`, `FS-11`）を統括するデータ＆デザインシステムアーキテクトです。

# Goal

`docs/03-Standards/` または `docs/05-DataDictionary/` において、バックエンド・デザインチーム・下流アプリケーションが参照する **Single Source of Truth（単一の真実の源）** として、以下の 4 つの公開契約カタログを定義・維持します。

1. **Error Code Catalog (`CS.01`, `FS-02`)**: 不変のエラーコード定数（`{Package}.{Category}.{Reason}`）と UI 向けローカライズ・RFC 7807 マッピング
2. **Design Tokens Dictionary (`@vk-blocks/theme`, `MB.06`)**: CSS 変数名、セマンティックトークン、および Light/Dark テーマ値定義
3. **Diagnostics & Analytics Semantic Dictionary (`OR.01`, `FS-11`)**: カスタムイベント名、計測プロパティキー、および W3C `traceparent` 伝播
4. **Client Storage & Cache Key Governance (`AP.07`, `OR.02`)**: SessionStorage / LocalStorage / IndexedDB / クエリキャッシュキーの命名規約とテナント隔離プレフィックス

# Constraints & Language

1. **不変性 (`ARCH-07`, `FS-02`)**: 一度公開されたエラーコード文字列、デザイン変数名、Telemetry イベント名の名称変更・削除は Breaking Change として扱い、ADR（`DL.03`）を伴うこと。
2. **出力言語**: ビジネスIT日本語（コード・識別子・見出しは英語併記、`BASE-09` 準拠）。

---

# Data Dictionary Structure (Must Follow)

```markdown
# 📖 Data Dictionary & Contract Catalog: `@vk-blocks/{packageName}`

> **Governance**: 本ドキュメントに記載されたエラー定数、デザイン変数、およびイベントキーは Level 1 公開契約であり、後方互換性のない変更には新バージョンの発行と ADR が必須です。

---

## 1. 🚨 Error Code Catalog (`CS.01`, `FS-02`)

> 命名規則: `{Package}.{Category}.{Reason}`（バックエンドと完全同期し、`as const` 型定義でミラーリングすること）

| Error Constant (TS) | Wire Error Code (`string`) | Category | HTTP Mapping | Default User Message (日本語) |
| :--- | :--- | :--- | :---: | :--- |
| `VKAuthErrors.InvalidCredentials` | `Auth.Identity.InvalidCredentials` | `Authentication` | `401` | メールアドレスまたはパスワードが正しくありません。 |
| `VKAuthErrors.SessionExpired` | `Auth.Session.Expired` | `Unauthorized` | `401` | セッションの有効期限が切れました。再度ログインしてください。 |
| `VKUiErrors.UploadSizeExceeded` | `Files.Upload.SizeExceeded` | `Validation` | `400` | ファイルサイズが上限を超えています。 |
| `VKTransportErrors.Timeout` | `Transport.Network.Timeout` | `Infrastructure` | `504` | サーバーとの通信がタイムアウトしました。 |

---

## 2. 🎨 Design Tokens & Theme Variables (`@vk-blocks/theme`)

> CSS Variables プレフィックス: `--vk-{category}-{property}-{variant}`

| Token Name | CSS Variable | Light Theme (Default) | Dark Theme | Purpose & Role |
| :--- | :--- | :--- | :--- | :--- |
| `color.bg.primary` | `--vk-color-bg-primary` | `#ffffff` | `#0f172a` | アプリケーションの基本背景色 |
| `color.text.primary` | `--vk-color-text-primary` | `#0f172a` | `#f8fafc` | 本文テキストの基本色 |
| `color.brand.default` | `--vk-color-brand-default` | `#2563eb` | `#3b82f6` | プライマリアクション・ブランド色 |
| `spacing.base` | `--vk-spacing-base` | `0.25rem (4px)` | `0.25rem (4px)` | レイアウト計算の最小基本グリッド単位 |
| `radius.md` | `--vk-radius-md` | `0.375rem (6px)` | `0.375rem (6px)` | 標準ボタン・入力欄の角丸 |

---

## 3. 📡 Analytics & Observability Dictionary (`OR.01`, `FS-11`)

> `diagnosticsConstants.ts` で公開される計測契約：

| Constant Name | Event / Metric Key | Payload Type | PII Scrubbed | Description |
| :--- | :--- | :--- | :---: | :--- |
| `EventButtonClick` | `vk.ui.button_click` | `{ buttonId: string; view: string }` | ✅ Safe | 重要アクションボタンのクリック |
| `EventFormSubmit` | `vk.ui.form_submit` | `{ formName: string; durationMs: number }` | ✅ Safe | フォーム送信所要時間と完了 |
| `MetricFCP` | `vk.web_vitals.fcp` | `{ value: number; rating: 'good'\|'poor' }` | ✅ Safe | First Contentful Paint 計測値 |

---

## 4. 🗄️ Client Storage & Cache Key Governance (`AP.07`, `OR.02`)

> 命名規則: `vk:{tenantId}:{module}:{key}`（マルチテナント隔離必須）

| Storage Tier | Key Pattern | TTL / Lifecycle | Description |
| :--- | :--- | :--- | :--- |
| `SessionStorage` | `vk:{tenantId}:auth:session_state` | ブラウザタブ終了まで | 一時的な画面状態の保持 |
| `IndexedDB` | `vk:{tenantId}:cache:{resource}` | 7日間 (LRU キャッシュ) | オフライン用・大量データキャッシュ |
| `TanStack Query` | `['vk', tenantId, resource, id]` | StaleTime: 5分 | サーバー状態クエリキャッシュキー |
```

