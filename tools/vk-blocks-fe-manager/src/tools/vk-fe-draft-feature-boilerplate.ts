import fs from 'node:fs/promises';
import path from 'node:path';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export async function handleDraftFeatureBoilerplate(
  args: any,
  workspaceRoot: string
): Promise<CallToolResult> {
  const { featureName, description } = args;

  if (!featureName) {
    throw new Error('featureName is required');
  }

  const featureDir = path.join(workspaceRoot, 'features', featureName);

  try {
    // Check if feature already exists
    try {
      await fs.stat(featureDir);
      throw new Error(`Feature '${featureName}' already exists.`);
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
    }

    // Create directories
    await fs.mkdir(featureDir, { recursive: true });
    await fs.mkdir(path.join(featureDir, 'components'));
    await fs.mkdir(path.join(featureDir, 'hooks'));
    await fs.mkdir(path.join(featureDir, 'services'));
    await fs.mkdir(path.join(featureDir, '_internal'));

    // Create README.md
    const readmeContent = `# ${featureName}

${description || 'Brief description of the feature.'}

## Architecture
- Contains feature-specific components, hooks, and services.
- Internal implementations are isolated within \`_internal/\`.
`;
    await fs.writeFile(path.join(featureDir, 'README.md'), readmeContent, 'utf-8');

    // Create index.ts (Barrel export)
    const indexContent = `/**
 * Public API Surface for ${featureName}
 * Follows AP.03 and MB.02 rules.
 */

// Export public types
export type * from './types.js';

// Export public components (Must use VK prefix)
// export { VKXxxComponent } from './components/XxxComponent.js';
`;
    await fs.writeFile(path.join(featureDir, 'index.ts'), indexContent, 'utf-8');

    // Create types.ts
    const typesContent = `/**
 * Public types for ${featureName}.
 * Internal types should remain in the files they are used or in _internal/types.ts
 */
`;
    await fs.writeFile(path.join(featureDir, 'types.ts'), typesContent, 'utf-8');

    // Create constants.ts
    const constantsContent = `/**
 * Shared constants for ${featureName}.
 */
`;
    await fs.writeFile(path.join(featureDir, 'constants.ts'), constantsContent, 'utf-8');

    return {
      content: [
        { 
          type: 'text', 
          text: `Successfully scaffolded feature module '${featureName}' at features/${featureName}/\n\nCompliant with MB.01.` 
        }
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to draft feature boilerplate: ${error.message}`);
  }
}
