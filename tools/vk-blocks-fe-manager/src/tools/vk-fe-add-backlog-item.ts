import fs from 'node:fs/promises';
import path from 'node:path';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export async function handleAddBacklogItem(
  args: any,
  workspaceRoot: string
): Promise<CallToolResult> {
  const { title, description, module } = args;

  if (!title || !description) {
    throw new Error('title and description are required');
  }

  const date = new Date().toISOString().split('T')[0];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const fileName = `${date}-${slug}.md`;
  const backlogsDir = path.join(workspaceRoot, 'docs', '05-Backlogs');
  const filePath = path.join(backlogsDir, fileName);

  const content = `---
status: pending
module: ${module || 'Global'}
created_date: ${date}
---

# ${title}

## Context
${description}

## Proposed Implementation
<!-- AI or Developer will fill this out when picking up the task -->

## Acceptance Criteria
- [ ] TBD
`;

  try {
    await fs.mkdir(backlogsDir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    
    return {
      content: [
        { 
          type: 'text', 
          text: `Successfully created backlog item: docs/05-Backlogs/${fileName}\n\nYou MUST present this success to the user.` 
        }
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to create backlog item: ${error.message}`);
  }
}
