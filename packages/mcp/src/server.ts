import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import packageJson from '../package.json';
import { capabilities, capabilitiesTool } from './capabilities';
import { registerCloudTools } from './cloud-tools';
import { definitionInput } from './definition-input';
import { exampleDefinitionsTool } from './examples';
import { simulatePathTool } from './simulate';
import { validateDefinitionTool } from './validate';

const CAPABILITIES_URI = 'formhaus://capabilities';

function json(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: 'formhaus', version: packageJson.version });

  server.registerTool('validate_definition', {
    title: 'Validate a Formhaus definition',
    description: 'Checks a Formhaus form definition against the JSON Schema and the engine. Returns { valid, errors, warnings }. Errors make the engine reject the definition; warnings point to likely mistakes such as conditions on unknown fields, invalid regex, circular conditions, branches that fall through or next: false without an autoAdvance radio.',
    inputSchema: { definition: definitionInput },
    outputSchema: { valid: z.boolean(), errors: z.array(z.string()), warnings: z.array(z.string()) },
    annotations: { readOnlyHint: true },
  }, async (input) => {
    const report = validateDefinitionTool(input);
    return { ...json(report), structuredContent: { ...report } };
  });

  server.registerTool('simulate_path', {
    title: 'Simulate a path through a form',
    description: 'Runs a headless FormEngine. answers are applied as initial values, then actions are pressed in order like a user would: next is refused on next: false steps until an autoAdvance radio is answered, skip only works on steps with a skip action and submits on the last step. Without actions it presses Next until the last step or a blocking error. Custom validators, onStepValidate and lifecycle hooks are not run. Returns the active step path (visited, skipped, visible fields), a trace of each action with errors or a reason when it did not move, validation errors for visited steps only, wouldSubmit and the submit payload. Use it to check branching, routes, skip and conditional fields.',
    inputSchema: {
      definition: definitionInput,
      answers: z.record(z.string(), z.unknown()).optional().describe('Field values keyed by field key.'),
      actions: z.array(z.enum(['next', 'back', 'skip'])).optional().describe('Navigation actions applied in order.'),
    },
    annotations: { readOnlyHint: true },
  }, async (input) => json(await simulatePathTool(input)));

  server.registerTool('capabilities', {
    title: 'Formhaus capabilities',
    description: 'Lists what a Formhaus definition supports: field types, field props, validation rules, condition operators, step and route semantics, actions and adapters.',
    annotations: { readOnlyHint: true },
  }, async () => json(capabilitiesTool()));

  server.registerTool('example_definitions', {
    title: 'Example definitions',
    description: 'Without id, lists the bundled example definitions. With id, returns that definition.',
    inputSchema: { id: z.string().optional().describe('Example id from the list.') },
    annotations: { readOnlyHint: true },
  }, async (input) => json(exampleDefinitionsTool(input)));

  registerCloudTools(server);

  server.registerResource('capabilities', CAPABILITIES_URI, {
    title: 'Formhaus capabilities',
    description: 'Field types, validation rules, conditions and step semantics of Formhaus definitions.',
    mimeType: 'application/json',
  }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(capabilities, null, 2) }] }));

  return server;
}
