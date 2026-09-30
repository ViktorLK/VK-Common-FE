import fs from 'node:fs/promises';
import path from 'node:path';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export async function handleDraftAdr(
  args: any,
  workspaceRoot: string
): Promise<CallToolResult> {
  const { title, context, decision } = args;

  if (!title || !context || !decision) {
    throw new Error('title, context, and decision are required');
  }

  const date = new Date().toISOString().split('T')[0];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const adrsDir = path.join(workspaceRoot, 'docs', '02-ArchitectureDecisionRecords');
  
  // Find the next ADR number
  let nextNumber = 1;
  try {
    const files = await fs.readdir(adrsDir);
    const adrFiles = files.filter(f => /^\d{4}-/.test(f));
    if (adrFiles.length > 0) {
      const highest = Math.max(...adrFiles.map(f => parseInt(f.substring(0, 4), 10)));
      nextNumber = highest + 1;
    }
  } catch {
    // Directory might not exist yet, default to 1
  }

  const paddedNumber = nextNumber.toString().padStart(4, '0');
  const fileName = `${paddedNumber}-${slug}.md`;
  const filePath = path.join(adrsDir, fileName);

  const content = `# ADR ${paddedNumber}: ${title}

Date: ${date}
Status: Proposed

## Context
${context}

## Decision
${decision}

## Consequences
<!-- Explain the positive and negative consequences of this decision -->
- Positive: TBD
- Negative: TBD
`;

  try {
    await fs.mkdir(adrsDir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    
    return {
      content: [
        { 
          type: 'text', 
          text: `Successfully drafted ADR: docs/02-ArchitectureDecisionRecords/${fileName}\n\nPresent this to the user for review.` 
        }
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to draft ADR: ${error.message}`);
  }
}
