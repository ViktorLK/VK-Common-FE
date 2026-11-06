---
name: vk-normalize-mechanical
description: Perform rapid, tool-based mechanical code normalization (Physical boundaries, Linter auto-fix, and Formatting) without AI overhead.
---

# VK Frontend: Mechanical Code Normalization (Lightweight)

This workflow combines strict physical file standards (UTF-8 No-BOM, trailing newline) with automated frontend tool formatting (`eslint --fix` / `prettier`). It is the recommended first step for code cleanup or before creating a Pull Request.

## Goal

Ensure all TypeScript, TSX, and JSON files adhere to VK physical file standards and linter formatting rules:
- **Physical**: No leading blanks, single trailing newline, UTF-8 (No BOM).
- **Logical & Style**: Automated linter fixes (`eslint --fix`) for imports, syntax formatting, and whitespace.

## Steps

### 1. Identify Target & Verify Clean Git State

- Determine the target package (e.g., `packages/core`) or file path.
- **Git Clean State Pre-Check**: Ensure the working tree is clean or changes are staged before running mechanical normalization:

```powershell
$status = git status --porcelain
if ($status) {
    Write-Warning "Git working tree or index has uncommitted changes. Proceed with caution."
}
```

### 2. Execute Mechanical Normalization

Run automated linter and style auto-fix on the target package:

```powershell
# Run lint auto-fix for the target package
pnpm --filter @vk-blocks/{packageName} run lint --fix
```

Or for root-level formatting:

```powershell
pnpm run lint --fix
```

### 3. Physical Boundary Normalization

Ensure files have UTF-8 encoding without BOM and a single trailing newline.

### 4. Diff Audit & Verification

1. **Audit Diff**:
   ```powershell
   git diff --stat
   ```
2. **Typecheck Verification**:
   ```powershell
   pnpm --filter @vk-blocks/{packageName} run typecheck
   ```

- Confirm that only mechanical formatting changes occurred.

