---
name: vk-sprint-plan
description: Plan and launch a 1-week personal Sprint, setting an overarching goal, checking capacity, and committing Ready backlog tasks.
---

# Skill: Sprint Planning (`vk-sprint-plan`)

Use this skill when starting a new personal Sprint cycle for the frontend ecosystem.

## Steps

1. **Verify Backlog Health & Follow-Ups**:
   - Call `vk_fe_backlog_lint` from `vk-blocks-fe-manager` to ensure no broken front-matters or ID duplicates exist.
   - If an active sprint is still running, prompt to close it first via `vk-sprint-review` or call `vk_fe_sprint_close` (or `vk_fe_sprint_reset` if abandoning an invalid test sprint).
   - Check previous Sprint's `Try` items in `docs/07-Backlogs/_sprints/` to prioritize carrying forward retrospective action items.

2. **Select Ready Candidates from Product Backlog**:
   - Read `docs/07-Backlogs/Product_Backlog.md`.
   - Prioritize items with `P0` and `P1` that are marked `Ready: ✅`.
   - **DoR Requirement**: If candidate tasks are not yet Ready (`ready: false`), invoke `vk-sprint-refine` first (supports comma-separated IDs for batch refinement) to assign Story Points and validate DoR.
   - Propose a focused scope of tasks (typically 2~4 tasks, points based on recent completed average or ~8~13 pts) aligned with a single cohesive theme (e.g. `@vk-blocks/ui` or `@vk-blocks/query`).

3. **Agree on Sprint Goal & Capacity**:
   - Formulate a clear, 1-sentence verifiable Sprint Goal (e.g., "UI パッケージの Radix Primitives 統合と DataGrid 仮想化の基盤整備を完了させる").
   - Compare total planned points against historical average velocity (Capacity). If exceeding capacity, confirm with the user whether to set `allowOverCapacity: true` or scale down scope.

4. **Launch Sprint**:
   - Call `vk_fe_sprint_start` from `vk-blocks-fe-manager` with:
     - `goal`: The 1-sentence Sprint goal.
     - `committedTaskIds`: Comma-separated task IDs (e.g. `#012,#013`).
     - `durationDays`: Default is 7.
     - `allowOverCapacity`: Set `true` only if explicitly approved by user to exceed capacity.
     - `overwrite`: Set `true` if replacing an active sprint or restarting the sprint in the same week.
   - The tool generates `docs/07-Backlogs/_sprints/S-{Year}-{Week}.md` (using ISO calendar week), records committed and capacity points, and updates `Active_Sprint.md` with Timebox and Burnup metrics.

