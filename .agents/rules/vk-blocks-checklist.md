---
trigger: always_on
---

<layer id="vk.fe" level="L3" name="VK Frontend Technology Stack" prefix="FE" inherits="vk.fullstack">
<charter>
scope: React 18+, Next.js (App Router), TypeScript (Strict Mode), Tailwind/Vanilla CSS, Client/Server boundary.
principle: Server Components first, composition over prop drilling, branded types, Zod boundary validation.
</charter>

> Governs frontend architecture via a **Tiered Strategy**:
> - **Tier 1 (Rule Index)**: One-line summaries of all frontend rules for baseline awareness.
> - **Tier 2 (Core Prohibitions)**: Type A/B hard constraints for immediate zero-tolerance enforcement.
> - **Tier 3 (Dynamic Loading)**: Scenario-driven rule fetching via `vk_fe_get_architectural_rule`.

<rule_index>

> One-line awareness of every rule. 🔴 = Type A (Logic Bottom Line - Unwaivable). 🟡 = Type B (Industrial Habit - Waivable in Labs).

| ID          |     | Constraint                                                                                        |
| :---------- | :-: | :------------------------------------------------------------------------------------------------ |
| **CS.01**   | 🔴  | `Result<T>` only. No null returns. Error constants on centralized error registry.                 |
| **CS.02**   |     | Layer deps: Domain ← App ← Infra. No reverse. No infra libs in shared logic. Server/client boundary enforced. |
| **CS.03**   | 🔴  | `async/await` everywhere. `AbortSignal` for cancellation. No unhandled promise rejections.        |
| **CS.04**   |     | No fetch in loops. `next/image` mandatory. Code splitting for non-critical components. Pagination mandatory. |
| **CS.05**   |     | Timestamps/soft-delete via API layer. Schema-based validation (Zod). No manual logic.             |
| **CS.06**   | 🔴  | No raw `Date.now()`/`crypto.randomUUID()` in business logic. Use centralized abstractions.        |
| **CS.07**   | 🔴  | Env vars validated via Zod. Typed `env.ts` module. No raw `process.env`. Client/server separation.|
| **OR.01**   | 🔴  | Centralized logger only. No `console.log()` in production. Structured context. TraceId mandatory. |
| **OR.02**   |     | No `dangerouslySetInnerHTML` without sanitization. Auth tokens in `httpOnly` cookies. CSP configured.|
| **OR.03**   |     | Retry + timeout on ALL external API calls. Error Boundaries per feature module.                   |
| **DL.01**   |     | Tests: Happy / Edge / Error / Loading states. RTL for components. Playwright for E2E.             |
| **DL.02**   | 🟡  | No placeholder code. No `// TODO`. Must compile (`tsc --noEmit`). No `@ts-ignore`.               |
| **DL.03**   | 🟡  | Interface/pattern change detected → prompt ADR before continuing.                                 |
| **DL.04**   | 🟡  | `// TODO` or roadmap detected → prompt backlog sync.                                              |
| **DL.05**   | 🟡  | Codegen outputs MUST be tagged with `[CODEGEN]`/`[SCHEMA]`/`[DERIVED]`.                          |
| **AP.01**   | 🔴  | `strict: true`. No `any`. No non-null assertions. `vkAssert` at boundaries. Exhaustive switches.  |
| **AP.02**   |     | Server Components first. Composition over prop drilling. Single component per file.               |
| **AP.03**   | 🟡  | Public API: `VK` prefix + barrel exports. Internal: `_internal/` + no VK prefix.                 |
| **AP.04**   |     | Server state via TanStack Query/RSC. Client state via React built-ins. URL state for shareables.  |
| **AP.05**   |     | Typed API clients. No raw `fetch()` in components. Error mapping at boundary.                     |
| **MB.01**   |     | Feature-first layout. Naming: kebab-case(dir), PascalCase(tsx), camelCase(ts).                   |
| **MB.02**   |     | Barrel exports per feature. Explicit exports only. No `export *`. ESLint import restrictions.     |
| **MB.03**   | 🟡  | Provider pattern for DI. Fail-fast on missing context. Typed contexts. No `any`.                  |
| **MB.04**   |     | API routes: Validate → Auth → Service → Map → Respond. No business logic in route handlers.      |
| **MB.05**   |     | Typed config interfaces. Env-bound values. Feature flags via hook. Readonly after init.           |
| **MB.06**   | 🟡  | Shared components: VK prefix, variant API, WCAG 2.1 AA, forwardRef, JSDoc.                       |
| **PS.01**   |     | Implementation plans MUST include Architecture Decision Audit section.                            |
| **PS.02**   |     | Walkthrough MUST link ADR if one was planned. Verify decision traceability.                       |
| **PS.03**   |     | Complex/experimental features → RFC-first in `docs/06-RFCs/` before backlog.                      |
| **PS.04**   | 🔴  | First mention of module → check local docs/manifesto BEFORE responding.                           |

</rule_index>

<core_prohibitions>

> Rules marked 🔴 (Type A) and 🟡 (Type B) are the core constraints. They follow this enforcement logic:

1. **Type A (Logic Bottom Line - 🔴)**: **Zero Tolerance, No Exceptions**. These govern stability and determinism (CS.01, CS.03, CS.06, CS.07, OR.01, AP.01, PS.04). They MUST be followed even in Labs or experimental contexts.
2. **Type B (Industrial Habits - 🟡)**: **Zero Tolerance by Default**. These govern naming, organization, and process (AP.03, MB.03, MB.06, DL.02, DL.03, DL.04, DL.05). They can be **waived** only in `src/labs` or when a Layer 2/3 prompt explicitly grants permission to deviate.
3. **Audit Flagging**: Every violation MUST produce `🚩 [RuleID] {rationale}`. For Type B waivers, the rationale should cite the permission (e.g., `🚩 [AP.03] Bypassed per LAB01`).
4. **Immediate Correction**: If a non-waived violation is detected, stop and fix it immediately.

**Type A IDs**: CS.01, CS.03, CS.06, CS.07, OR.01, AP.01, PS.04
**Type B IDs**: AP.03, MB.03, MB.06, DL.02, DL.03, DL.04, DL.05

</core_prohibitions>

<dynamic_loading_protocol>

> **[MCP Routing Rule]**: Frontend -> MUST call `vk_fe_get_architectural_rule` from `vk-blocks-fe-manager`.

> **[MANDATORY]**: Rule index summaries are for awareness only. You are **STRICTLY PROHIBITED** from using memory or one-liners to decide file names, visibility, or structure. You MUST fetch the full rule specification via `vk_fe_get_architectural_rule` for each matching scenario below and declare fetched Rule IDs in the Handshake `Sync: [...]`. Missing Rule Sync for a scenario → code output PROHIBITED.

| Scenario                          | Rules to Fetch                |
| :-------------------------------- | :---------------------------- |
| **Any code change**               | CS.01, AP.01                  |
| **Async / streaming code**        | CS.03                         |
| **New file or folder creation**   | AP.03, MB.01 (Naming)        |
| **Component creation**            | AP.02, MB.06                  |
| **State management**              | AP.04                         |
| **API integration / fetch**       | AP.05, MB.04                  |
| **Form handling**                 | CS.05, AP.04                  |
| **Logging / Analytics**           | OR.01                         |
| **External API calls**            | OR.03                         |
| **Test creation**                 | DL.01                         |
| **Module barrel exports**         | MB.02, AP.03                  |
| **Provider / Context creation**   | MB.03                         |
| **Configuration / Env vars**      | CS.07, MB.05                  |
| **Shared UI component**           | MB.06, AP.02                  |
| **Feature flag integration**      | MB.05                         |
| **Security-sensitive code**       | OR.02                         |
| **Implementation plan**           | PS.01, PS.03                  |
| **Walkthrough**                   | PS.02                         |
| **Feature-specific work**         | PS.04 (Check local docs)      |

</dynamic_loading_protocol>
</layer>
