---
name: vk-add-backlog
description: Create a prioritized atomic backlog task in docs/07-Backlogs/ and sync Active_Sprint.md and Product_Backlog.md using vk_fe_add_backlog_item and docs/00-Blueprints/07-BacklogItemBlueprint.md (DL.04).
---

# Skill: Add Atomic Backlog Item (`DL.04`)

Use this skill when technical debt, audit findings (from `docs/06-AuditReports/`), or approved RFC tasks (from `docs/02-RFCs/`) need to be recorded as actionable backlog items in `docs/07-Backlogs/`.

## Steps

1. **Load the Single Source of Truth Blueprint**:
   - Read `docs/00-Blueprints/07-BacklogItemBlueprint.md` to determine the priority classification (`P0` / `P1` for Type A violations, `P2` for Type B or features, `P3` for optimizations) and structured description format.

2. **Invoke Deterministic MCP Tool**:
   - Call `vk_fe_add_backlog_item` from `vk-blocks-fe-manager` with:
     - `module`: Target module / package (e.g. `Core`, `UI`, `API`, `Query`, `Forms`, `Theme`, `Table`).
     - `title`: Short descriptive title in English.
     - `description`: Structured text containing `### 1. Problem / Context` and `### 2. Proposed Changes` per `07-BacklogItemBlueprint.md`.
     - `category`: `task`, `story`, `feature`, `debt`, or `spike`.
     - `priority`: `P0`, `P1`, `P2`, or `P3` (also accepts `High`, `Medium`, `Low`).
     - `status`: `todo` or `icebox`.
     - `reference`: Rule IDs, ADR link, or Audit Report path (e.g., `AP.01, CS.01`).
   - The MCP tool automatically assigns the next sequential ID (`#NNN`), writes the task file under `docs/07-Backlogs/{Module}/`, and regenerates `Product_Backlog.md`, `Active_Sprint.md`, and `README.md`.

3. **Verify and Report**:
   - Confirm created task path and updated boards.
