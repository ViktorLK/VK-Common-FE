import fs from 'node:fs/promises';
import path from 'node:path';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export async function handleGetArchitecturalRule(
  args: any,
  workspaceRoot: string
): Promise<CallToolResult> {
  const ruleIds = args.ruleIds as string[];
  if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
    throw new Error('ruleIds must be a non-empty array of strings');
  }

  const rulesDir = path.join(workspaceRoot, '.agents', 'rules');
  
  try {
    const files = await fs.readdir(rulesDir);
    const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'vk-blocks-checklist.md');
    
    const results: string[] = [];

    for (const ruleId of ruleIds) {
      let found = false;
      for (const file of mdFiles) {
        const filePath = path.join(rulesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Simple regex to extract the rule section
        // Matches "### CS.01 — Title" and everything until the next "###" or end of file
        const escapedId = ruleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`###\\s+${escapedId}\\s+—[\\s\\S]*?(?=\\n###\\s+|$)`, 'g');
        const match = regex.exec(content);
        
        if (match) {
          results.push(`[Source: ${file}]\n${match[0].trim()}\n`);
          found = true;
          break;
        }
      }
      if (!found) {
        results.push(`[Rule ${ruleId} NOT FOUND]\n`);
      }
    }

    return {
      content: [{ type: 'text', text: results.join('\n---\n') }],
    };
  } catch (error: any) {
    throw new Error(`Failed to read architectural rules: ${error.message}`);
  }
}
