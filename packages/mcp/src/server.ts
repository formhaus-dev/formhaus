import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import packageJson from '../package.json';
import { capabilities, capabilitiesTool } from './capabilities';
import { SERVER_INSTRUCTIONS } from './cloud-text';
import { registerCloudTools } from './cloud-tools';
import { definitionInput } from './definition-input';
import { exampleDefinitionsTool } from './examples';
import { simulatePathTool } from './simulate';
import { capabilitiesOutput, examplesOutput, simulationOutput, templateOutput, validationOutput } from './outputs';
import { translationTemplateTool } from './translation';
import migration from '../../../docs/migrate/0.11.md';
import { validateDefinitionTool } from './validate';

const CAPABILITIES_URI = 'formhaus://capabilities';
const MIGRATION_URI = 'formhaus://migrate/0.11';

function json(value: object) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: { ...value } as Record<string, unknown>,
  };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: 'formhaus', version: packageJson.version }, { instructions: SERVER_INSTRUCTIONS });

  server.registerTool(
    'validate_definition',
    {
      title: 'Validate a Formhaus definition',
      description:
        'Call this after writing or editing a definition and before simulate_path or publish_form; it checks the structure and engine rules, while simulate_path checks how a user moves through the form. Checks a Formhaus form definition against the JSON Schema and the engine. Returns { valid, issues }. Each issue has code, severity ("error" or "warning"), a JSON pointer path, message and hint. Errors make the engine reject the definition, such as a condition with zero or two operators, a condition on a later step, a duplicate key or a route to an earlier step. Warnings point to likely mistakes, such as a condition value that is not an option, a select without options or next: false without an autoAdvance radio. Fix each error at its path and call again.',
      inputSchema: { definition: definitionInput },
      outputSchema: validationOutput,
      annotations: { readOnlyHint: true },
    },
    async (input) => json(validateDefinitionTool(input)),
  );

  server.registerTool(
    'simulate_path',
    {
      title: 'Simulate a path through a form',
      description:
        'Call this after validate_definition passes, to check branching, routes, skip and conditional fields by stepping through the form like a user; validate_definition checks only the structure. Runs a headless FormEngine. answers are applied as initial values, then actions are pressed in order like a user would: next is refused while its disabled conditions match and on next: false steps until an autoAdvance radio is answered, skip only works on steps with a skip action and submits on the last step. Without actions it presses Next until the last step or a blocking error. Custom validators, onStepValidate and lifecycle hooks are not run. When the definition has errors, returns ok: false and the same validation issues as validate_definition. Otherwise returns the active step path (visited, skipped, visible fields), a trace of each action with errors or a reason when it did not move, validation errors for visited steps only, wouldSubmit (false while submit is disabled) and the submit payload. Pass overlay to run the form in a translated language; overlayIssues lists overlay entries that were ignored or do not match the source.',
      inputSchema: {
        definition: definitionInput,
        answers: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            'Field values keyed by field key, applied as initial values before the actions, such as {"email": "ann@example.com", "plan": "pro"}. select, radio and multiselect take option values, not labels. Omit to start with an empty form.',
          ),
        actions: z
          .array(z.enum(['next', 'back', 'skip']))
          .optional()
          .describe(
            'Buttons to press in order, each "next", "back" or "skip". Omit to press Next until the last step or the first blocking error.',
          ),
        overlay: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            'Translation overlay for one language: the overlay from translation_template with its values translated. Applied before the run, so labels and errors come out in that language. Omit to run in the source language.',
          ),
      },
      outputSchema: simulationOutput,
      annotations: { readOnlyHint: true },
    },
    async (input) => json(await simulatePathTool(input)),
  );

  server.registerTool(
    'translation_template',
    {
      title: 'Translation template',
      description:
        'Call this when the form needs another language, once per language: it returns the overlay to translate, which simulate_path accepts as overlay to check the result. Returns the translation skeleton of a definition for one language: overlay is nested JSON with the source texts as values, file is the suggested name (signup.ru.json), slots lists every text with its address, translation key, {placeholders} and a source hash. Translate only the values, keep nesting, identifiers and {placeholders}, then save the overlay next to the definition. Store revision and review state separately; the template never marks anything as translated. When the app has its own keys, such as Lokalise keys, put them in "i18n" objects of the definition exactly as given instead. When the definition has errors, returns ok: false and the validation issues.',
      inputSchema: {
        definition: definitionInput,
        lang: z.string().describe('Target language code, such as "ru" or "pt-BR". It names the suggested file, such as signup.ru.json.'),
        prefix: z
          .union([z.string(), z.literal(false)])
          .optional()
          .describe(
            'Prefix of derived translation keys, such as "signup" for keys like signup.title. Defaults to the form id. Pass false to list only the explicit keys from i18n objects.',
          ),
      },
      outputSchema: templateOutput,
      annotations: { readOnlyHint: true },
    },
    async (input) => json(translationTemplateTool(input)),
  );

  server.registerTool(
    'capabilities',
    {
      title: 'Formhaus capabilities',
      description:
        'Call this first, before writing or editing a definition, for the full reference of what a definition supports; example_definitions gives whole working forms to copy instead. Lists what a Formhaus definition supports: field types, field props, validation rules, condition operators, step and route semantics, actions, translation (lang, messages, labels, i18n keys, overlay addresses) and adapters. To check a finished definition, call validate_definition instead. To upgrade a 0.10 project, read the formhaus://migrate/0.11 resource.',
      outputSchema: capabilitiesOutput,
      annotations: { readOnlyHint: true },
    },
    async () => json(capabilitiesTool()),
  );

  server.registerTool(
    'example_definitions',
    {
      title: 'Example definitions',
      description:
        'Call this when you need a working form to start from or a pattern to copy, such as multi-step forms, branching routes, conditions or translations; capabilities lists every option but shows no complete form. Without id, lists the bundled example definitions. With id, returns that definition. Adapt it, then check it with validate_definition.',
      inputSchema: {
        id: z
          .string()
          .optional()
          .describe(
            'Id of one example, such as "branching-account", taken from the list this tool returns without id. Omit to list the examples.',
          ),
      },
      outputSchema: examplesOutput,
      annotations: { readOnlyHint: true },
    },
    async (input) => json(exampleDefinitionsTool(input)),
  );

  registerCloudTools(server);

  server.registerResource(
    'capabilities',
    CAPABILITIES_URI,
    {
      title: 'Formhaus capabilities',
      description: 'Field types, validation rules, conditions and step semantics of Formhaus definitions.',
      mimeType: 'application/json',
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(capabilities, null, 2) }] }),
  );

  server.registerResource(
    'migrate-0.11',
    MIGRATION_URI,
    {
      title: 'Migrate Formhaus code and definitions to 0.11',
      description:
        'Every renamed or removed API, prop, event and definition rule from 0.10 to 0.11, with before and after code and a grep list. Read it before upgrading a project.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: migration }] }),
  );

  return server;
}
