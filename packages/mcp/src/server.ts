import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import packageJson from '../package.json';
import { capabilities, capabilitiesTool } from './capabilities';
import { registerCloudTools } from './cloud-tools';
import { definitionInput } from './definition-input';
import { exampleDefinitionsTool } from './examples';
import { simulatePathTool } from './simulate';
import { capabilitiesOutput, examplesOutput, simulationOutput, validationOutput } from './outputs';
import migration from '../../../docs/migrate/0.11.md';
import { validateDefinitionTool } from './validate';

const CAPABILITIES_URI = 'formhaus://capabilities';
const MIGRATION_URI = 'formhaus://migrate/0.11';

function json(value: object) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }], structuredContent: { ...value } as Record<string, unknown> };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: 'formhaus', version: packageJson.version });

  server.registerTool('validate_definition', {
    title: 'Validate a Formhaus definition',
    description: 'Checks a Formhaus form definition against the JSON Schema and the engine. Returns { valid, issues }. Each issue has code, severity ("error" or "warning"), a JSON pointer path, message and hint. Errors make the engine reject the definition, such as a condition with zero or two operators, a condition on a later step, a duplicate key or a route to an earlier step. Warnings point to likely mistakes, such as a condition value that is not an option, a select without options or next: false without an autoAdvance radio. Fix each error at its path and call again.',
    inputSchema: { definition: definitionInput },
    outputSchema: validationOutput,
    annotations: { readOnlyHint: true },
  }, async (input) => json(validateDefinitionTool(input)));

  server.registerTool('simulate_path', {
    title: 'Simulate a path through a form',
    description: 'Runs a headless FormEngine. answers are applied as initial values, then actions are pressed in order like a user would: next is refused while its disabled conditions match and on next: false steps until an autoAdvance radio is answered, skip only works on steps with a skip action and submits on the last step. Without actions it presses Next until the last step or a blocking error. Custom validators, onStepValidate and lifecycle hooks are not run. When the definition has errors, returns ok: false and the same validation issues as validate_definition. Otherwise returns the active step path (visited, skipped, visible fields), a trace of each action with errors or a reason when it did not move, validation errors for visited steps only, wouldSubmit (false while submit is disabled) and the submit payload. Use it to check branching, routes, skip and conditional fields.',
    inputSchema: {
      definition: definitionInput,
      answers: z.record(z.string(), z.unknown()).optional().describe('Field values keyed by field key.'),
      actions: z.array(z.enum(['next', 'back', 'skip'])).optional().describe('Navigation actions applied in order.'),
    },
    outputSchema: simulationOutput,
    annotations: { readOnlyHint: true },
  }, async (input) => json(await simulatePathTool(input)));

  server.registerTool('capabilities', {
    title: 'Formhaus capabilities',
    description: 'Lists what a Formhaus definition supports: field types, field props, validation rules, condition operators, step and route semantics, actions and adapters. To upgrade a 0.10 project, read the formhaus://migrate/0.11 resource.',
    outputSchema: capabilitiesOutput,
    annotations: { readOnlyHint: true },
  }, async () => json(capabilitiesTool()));

  server.registerTool('example_definitions', {
    title: 'Example definitions',
    description: 'Without id, lists the bundled example definitions. With id, returns that definition.',
    inputSchema: { id: z.string().optional().describe('Example id from the list.') },
    outputSchema: examplesOutput,
    annotations: { readOnlyHint: true },
  }, async (input) => json(exampleDefinitionsTool(input)));

  registerCloudTools(server);

  server.registerResource('capabilities', CAPABILITIES_URI, {
    title: 'Formhaus capabilities',
    description: 'Field types, validation rules, conditions and step semantics of Formhaus definitions.',
    mimeType: 'application/json',
  }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(capabilities, null, 2) }] }));

  server.registerResource('migrate-0.11', MIGRATION_URI, {
    title: 'Migrate Formhaus code and definitions to 0.11',
    description: 'Every renamed or removed API, prop, event and definition rule from 0.10 to 0.11, with before and after code and a grep list. Read it before upgrading a project.',
    mimeType: 'text/markdown',
  }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: migration }] }));

  return server;
}
