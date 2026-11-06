---
name: vk-docs-normalize-links
description: Standardize internal documentation links to repository-root-relative paths (/packages/, /docs/, /.agents/) across all MD files safely.
---

## Goal

Normalize all internal links in **all Markdown files (`.md`)** across the entire repository to follow the repository-root-relative convention (`/packages/...`, `/docs/...`, `/.agents/...`) and remove local absolute file URIs, while strictly preserving character encoding (UTF-8) per `BASE-11`.

## Steps

1. **Enumerate Targets (Git-Aware)**:
   - Use `git ls-files "*.md"` and `git ls-files -o --exclude-standard "*.md"` to identify all Markdown files.
   - This approach strictly respects `.gitignore` rules (ignoring `node_modules`, `dist`, `.turbo`, etc.) and ensures only tracked or intentional files are processed.

2. **Calculate Repository Root**:
   - Determine the absolute local path of the current repository root (using workspace path context) to identify absolute file URIs that need removal.

3. **Safe Link Normalization (File-by-File)**:
   - **CRITICAL**: Do NOT use bulk terminal commands (like PowerShell pipes) that risk multi-byte character corruption.
   - For each Markdown file:
     - Read the file content using the file read tool.
     - Apply the following replacements in the AI's internal memory:
       - Replace absolute local file URIs (e.g., `file:///path/to/repo/`) with `/`.
       - Standardize relative links that start with `packages/`, `docs/`, or `.agents/` by adding a leading slash (e.g., `[text](packages/core/src/index.ts)` -> `[text](/packages/core/src/index.ts)`).
       - Replace upward relative links (e.g., `../../00-Blueprints/...` or `../../../packages/...`) with their respective repository-root-relative equivalents (`/docs/00-Blueprints/...`, `/packages/...`).
     - If changes are needed, save the modified content back using the file writing/editing tools.

4. **Verify Encoding and Readability**:
   - After processing, read at least one file containing multi-byte characters (Japanese or Chinese) to ensure no mojibake occurred.

5. **Final Cleanup**:
   - Provide a summary of how many files were modified and confirm that no upward relative `../` links or local `file:///` links remain in internal references.

