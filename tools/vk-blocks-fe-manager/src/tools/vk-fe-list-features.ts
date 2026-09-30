import fs from 'node:fs/promises';
import path from 'node:path';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export async function handleListFeatures(
  workspaceRoot: string
): Promise<CallToolResult> {
  const featuresDir = path.join(workspaceRoot, 'features');
  
  try {
    let results: string[] = [];
    results.push(`# Registered Feature Modules\n`);

    try {
      const files = await fs.readdir(featuresDir, { withFileTypes: true });
      const modules = files.filter(f => f.isDirectory()).map(f => f.name);

      if (modules.length === 0) {
        results.push('No features found in `features/` directory.');
      } else {
        for (const mod of modules) {
          results.push(`## ${mod}`);
          
          try {
            const indexPath = path.join(featuresDir, mod, 'index.ts');
            const index = await fs.readFile(indexPath, 'utf-8');
            results.push(`Public exports:\n\`\`\`typescript\n${index}\n\`\`\`\n`);
          } catch {
            results.push(`No public API (missing \`index.ts\`).\n`);
          }
        }
      }
    } catch {
      results.push('The `features/` directory does not exist yet.');
    }

    return {
      content: [{ type: 'text', text: results.join('\n') }],
    };
  } catch (error: any) {
    throw new Error(`Failed to list features: ${error.message}`);
  }
}
