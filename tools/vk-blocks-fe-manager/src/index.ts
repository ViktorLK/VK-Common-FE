#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { handleGetArchitecturalRule } from './tools/vk-fe-get-architectural-rule.js';
import { handleGetModuleContext } from './tools/vk-fe-get-module-context.js';
import { handleListFeatures } from './tools/vk-fe-list-features.js';
import { handleAddBacklogItem } from './tools/vk-fe-add-backlog-item.js';
import { handleDraftAdr } from './tools/vk-fe-draft-adr.js';
import { handleDraftFeatureBoilerplate } from './tools/vk-fe-draft-feature-boilerplate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

const server = new Server(
  {
    name: 'vk-blocks-fe-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'vk_fe_get_architectural_rule',
        description: 'Reads specific L3 architectural rules from the .agents/rules/ directory.',
        inputSchema: {
          type: 'object',
          properties: {
            ruleIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of Rule IDs to fetch (e.g., ["AP.04", "MB.01"])'
            }
          },
          required: ['ruleIds']
        }
      },
      {
        name: 'vk_fe_get_module_context',
        description: 'Scans a frontend feature module to find local manifestos, READMEs, and barrel exports.',
        inputSchema: {
          type: 'object',
          properties: {
            modulePath: {
              type: 'string',
              description: 'Relative path to the module directory (e.g., "features/auth")'
            }
          },
          required: ['modulePath']
        }
      },
      {
        name: 'vk_fe_list_features',
        description: 'Lists all registered feature modules and their exposed public APIs.',
        inputSchema: {
          type: 'object',
          properties: {},
        }
      },
      {
        name: 'vk_fe_add_backlog_item',
        description: 'Creates a backlog item for technical debt or roadmap tasks.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            module: { type: 'string', description: 'Module name or Global' }
          },
          required: ['title', 'description']
        }
      },
      {
        name: 'vk_fe_draft_adr',
        description: 'Drafts an Architecture Decision Record (ADR) for major technical choices.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            context: { type: 'string' },
            decision: { type: 'string' }
          },
          required: ['title', 'context', 'decision']
        }
      },
      {
        name: 'vk_fe_draft_feature_boilerplate',
        description: 'Scaffolds a compliant Feature module according to MB.01 rules.',
        inputSchema: {
          type: 'object',
          properties: {
            featureName: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['featureName']
        }
      }
    ],
  };
});

// Handle Tool Calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'vk_fe_get_architectural_rule':
        return await handleGetArchitecturalRule(args, WORKSPACE_ROOT);
      
      case 'vk_fe_get_module_context':
        return await handleGetModuleContext(args, WORKSPACE_ROOT);
      
      case 'vk_fe_list_features':
        return await handleListFeatures(WORKSPACE_ROOT);
      
      case 'vk_fe_add_backlog_item':
        return await handleAddBacklogItem(args, WORKSPACE_ROOT);
        
      case 'vk_fe_draft_adr':
        return await handleDraftAdr(args, WORKSPACE_ROOT);
        
      case 'vk_fe_draft_feature_boilerplate':
        return await handleDraftFeatureBoilerplate(args, WORKSPACE_ROOT);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`
        }
      ]
    };
  }
});

// Start Server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('vk-blocks-fe-manager MCP server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
