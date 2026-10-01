import fs from 'node:fs/promises';
import path from 'node:path';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export async function handleGetModuleContext(
  args: any,
  workspaceRoot: string
): Promise<CallToolResult> {
  const modulePath = args.modulePath as string;
  if (!modulePath) {
    throw new Error('modulePath is required');
  }

  const targetDir = path.resolve(workspaceRoot, modulePath);
  
  // Ensure we don't escape the workspace
  if (!targetDir.startsWith(workspaceRoot)) {
    throw new Error('modulePath must be within the workspace');
  }

  try {
    const results: string[] = [];
    results.push(`# Context for Module: ${modulePath}\n`);

    // 1. Read README.md if it exists
    try {
      const readmePath = path.join(targetDir, 'README.md');
      const readme = await fs.readFile(readmePath, 'utf-8');
      results.push(`## README.md\n\n${readme}\n`);
    } catch {
      // Ignore if not found
    }

    // 2. Read local .prompts directory if it exists
    try {
      const promptsDir = path.join(targetDir, '.prompts');
      const promptFiles = await fs.readdir(promptsDir);
      for (const file of promptFiles) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(promptsDir, file), 'utf-8');
          results.push(`## Local Prompt: ${file}\n\n${content}\n`);
        }
      }
    } catch {
      // Ignore if not found
    }

    // 3. Scan for barrel exports
    try {
      const indexPath = path.join(targetDir, 'index.ts');
      const index = await fs.readFile(indexPath, 'utf-8');
      results.push(`## Public API (index.ts)\n\n\`\`\`typescript\n${index}\n\`\`\`\n`);
    } catch {
      results.push(`## Public API (index.ts)\n\nNot found. Module may not expose a public API.\n`);
    }

    // 4. Structure listing (depth 1)
    try {
      const files = await fs.readdir(targetDir, { withFileTypes: true });
      const dirs = files.filter(f => f.isDirectory()).map(f => f.name + '/');
      const standardDirs = ['components/', 'hooks/', 'services/', 'types.ts', 'constants.ts', 'schemas.ts', '_internal/'];
      
      results.push(`## Structure Validation`);
      results.push(`Detected sub-directories: ${dirs.join(', ') || 'None'}`);
      
      const isCompliant = dirs.includes('_internal/');
      results.push(`Has _internal/ isolation: ${isCompliant ? 'Yes' : 'No'}`);
    } catch (e: any) {
      results.push(`Failed to list structure: ${e.message}`);
    }

    return {
      content: [{ type: 'text', text: results.join('\n') }],
    };
  } catch (error: any) {
    throw new Error(`Failed to get module context: ${error.message}`);
  }
}
