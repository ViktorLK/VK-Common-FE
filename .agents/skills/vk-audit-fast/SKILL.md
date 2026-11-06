---
name: vk-audit-fast
description: Perform a fast, grep-based architecture checklist audit on a specified frontend package. Output is inline (no file saved).
---

# Workflow: Fast Frontend Architecture Audit (Checklist Mode)

A lightweight, high-speed audit that uses **only directory listing and grep searches** to evaluate a Monorepo package against VK.Blocks architectural rules. No file contents are read deeply. Output is returned directly in the conversation.

## Step 1: Identify the Target & Bootstrap Context (PS.04)

1. Determine the **target package** (`packages/{packageName}`) from the user's input.
2. If not provided, ask: `"Which package would you like me to fast-audit?"`
3. **Mandatory**: Call `vk_fe_get_module_context(modulePath)` to load localized prompts and rules.

## Step 2: Rule Differential Loading (L3 Verification)

1. Review rules provided in the context; call `vk_fe_get_architectural_rule` for any missing rules:
   - **Required**: `MB.01, AP.03, AP.01, CS.01`
2. **Output**: `Audit Load: [MB.01:L3, AP.03:L3, AP.01:L3, CS.01:L3] | Status: Verified ✅`

## Step 3: Structural Checks (File & Directory Layout)

Check the target package directory:

| ID | Rule | Tier | Check | Pass Condition |
|:---|:-----|:-----|:------|:---------------|
| S-01 | MB.01 | 🔴 | `package.json` exists | `packages/{name}/package.json` present |
| S-02 | MB.01 | 🔴 | `src/index.ts` barrel file exists | Public barrel entry present |
| S-03 | AP.03 | 🟡 | `src/_internal/` scoping exists | Internal implementation details isolated |
| S-04 | MB.01 | 🟡 | `tsconfig.json` exists | Package-level TypeScript configuration present |

## Step 4: Barrel Export Checks (src/index.ts)

| ID | Rule | Tier | Check | grep Query / Inspection | Pass Condition |
|:---|:-----|:-----|:------|:------------------------|:---------------|
| B-01 | MB.02 | 🔴 | No wildcard re-exports | `export \*` in `src/index.ts` | **NOT found** = Pass |
| B-02 | AP.03 | 🟡 | Public exports use `VK` prefix | `export \{ [^}]*\b(?!VK|useVK|type VK)\w+` | All exported components/hooks have `VK` / `useVK` prefix |
| B-03 | AP.03 | 🔴 | No export from `_internal/` in barrel | `export .* from ['"].*_internal` | **NOT found** = Pass |

## Step 5: Industrial DNA Checks (Package-Wide Grep)

| ID | Rule | Tier | Check | grep Query (in src/) | Pass Condition |
|:---|:-----|:-----|:------|:---------------------|:---------------|
| D-01 | AP.01 | 🔴 | Strict: No `any` type | `:\s*any\b` or `as any` | **0 occurrences** = Pass |
| D-02 | AP.01 | 🔴 | No non-null assertions (`!`) | `\w+!(?:\.\|\[|\()` (exclude test files) | **0 occurrences** = Pass |
| D-03 | DL.02 | 🟡 | No `@ts-ignore` | `@ts-ignore` | **0 occurrences** = Pass |
| D-04 | OR.01 | 🔴 | No bare `console.log` | `console\.(log\|warn\|error)\(` | **0 occurrences** in production code |
| D-05 | CS.01 | 🔴 | Result pattern usage | `Result<` or `Result\.failure` or `Result\.success` | Present in services/API boundary |
| D-06 | AP.01 | 🔴 | Defensive programming (`vkAssert`) | `vkAssert\.` or `vkGuard\.` | Present at boundary entries |

## Step 6: Output the Report

Output the results directly in the conversation:
- Handshake: `Active: [L0-L3:{packageName}] | Context: packages/{packageName} | Sync: Ready`
- Score: `Total Score: X/Y (Pass/Warn/Fail)`
- Flagged violations: `Audit: ✅` or `Audit: 🚩 [RuleID] {Rationale}`

