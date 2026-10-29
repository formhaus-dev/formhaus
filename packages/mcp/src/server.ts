import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import packageJson from '../package.json';
import { capabilities, capabilitiesTool } from './capabilities';
import { SERVER_INSTRUCTIONS } from './cloud-text';
import { registerCloudTools } from './cloud-tools';
import { definitionInput } from './definition-input';
import { exampleDefinitionsTool } from './examples';
import { simulatePathTool } from './simulate';
import { capabilitiesOutput, examplesOutput, fixOutput, simulationOutput, templateOutput, validationOutput } from './outputs';
import { translationTemplateTool } from './translation';
import { fixDefinitionTool, validateDefinitionTool } from './validate';

const CAPABILITIES_URI = 'formhaus://capabilities';

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
        'Call this after writing or editing a definition and before simulate_path or publish_form; it checks the structure and engine rules, while simulate_path checks how a user moves through the form. Checks a Formhaus form definition against the JSON Schema and the engine. Returns { valid, issues }. Each issue has code, severity ("error" or "warning"), a JSON pointer path, message, hint and, when a repair is known, fixes: a list of { title, safe, patch } where patch is an RFC 6902 JSON Patch. Errors make the engine reject the definition, such as a condition with zero or two operators, a condition on a later step, a duplicate key, a route to an earlier step, a condition outside a group on a field inside it (group-scope) or a section inside a section (invalid-nesting). Warnings point to likely mistakes, such as a condition value that is not an option, contains on a field that does not hold a list (contains-not-list), a contains value that is not an option (contains-not-in-options), a select without options, next: false without an autoAdvance radio, scale or rating, a scale range outside 3 to 11 points, an anchor outside the range, or matrix rows whose options differ. Fix each error at its path, or apply one of its fixes, and call again. To apply every safe fix at once, call fix_definition.',
      inputSchema: { definition: definitionInput },
      outputSchema: validationOutput,
      annotations: { readOnlyHint: true },
    },
    async (input) => json(validateDefinitionTool(input)),
  );

  server.registerTool(
    'fix_definition',
    {
      title: 'Apply safe fixes to a Formhaus definition',
      description:
        'Call this when validate_definition reports issues with safe fixes, such as a misspelled property name, a missing id or key, an empty label, a one-letter typo in a condition field, a duplicate key nothing refers to or a missing submit button. Applies every safe fix and returns { definition, applied, valid, issues }: the repaired definition, the fixes applied in order, and the issues left, the same as validate_definition returns for the repaired definition. Safe fixes never change what the form does beyond the repair. Unsafe fixes, such as pointing a condition at a field two edits away, stay in issues[].fixes for you to check and apply by hand. Save the returned definition, then fix the remaining errors.',
      inputSchema: { definition: definitionInput },
      outputSchema: fixOutput,
      annotations: { readOnlyHint: true },
    },
    async (input) => json(fixDefinitionTool(input)),
  );

  server.registerTool(
    'simulate_path',
    {
      title: 'Simulate a path through a form',
      description:
        'Call this after validate_definition passes, to check branching, routes, skip and conditional fields by stepping through the form like a user; validate_definition checks only the structure. Runs a headless FormEngine. answers are applied as initial values; a group answer is an array of item objects, such as { "participants": [{ "name": "Ada" }] }. Then actions are pressed in order like a user would: next is refused while its disabled conditions match and on next: false steps until an autoAdvance radio, scale or rating is answered, skip only works on steps with a skip action and submits on the last step. Without actions it presses Next until the last step or a blocking error. Custom validators, onStepValidate and lifecycle hooks are not run. When the definition has errors, returns ok: false and the same validation issues as validate_definition. Otherwise returns the active step path (visited, skipped, visible fields, with item fields as paths such as participants.0.email), a trace of each action with errors or a reason when it did not move, validation errors for visited steps only, wouldSubmit (false while submit is disabled) and the submit payload. Pass overlay to run the form in a translated language; overlayIssues lists overlay entries that were ignored or do not match the source.',
      inputSchema: {
        definition: definitionInput,
        answers: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            'Field values keyed by field key, applied as initial values before the actions, such as {"email": "ann@example.com", "plan": "pro"}. select, radio and multiselect take option values, not labels; scale and rating take whole numbers. Omit to start with an empty form.',
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
        'Call this when the form needs another language, once per language: it returns the overlay to translate, which simulate_path accepts as overlay to check the result. Returns the translation skeleton of a definition for one language: overlay is nested JSON with the source texts as values and a locale key, which the app passes as the locale prop, file is the suggested name (signup.ru.json), slots lists every text with its address, translation key, {placeholders} and a source hash. Translate only the values, keep nesting, identifiers and {placeholders}, then save the overlay next to the definition. Store revision and review state separately; the template never marks anything as translated. When the app has its own keys, such as Lokalise keys, put them in "i18n" objects of the definition exactly as given instead. When the definition has errors, returns ok: false and the validation issues.',
      inputSchema: {
        definition: definitionInput,
        lang: z.string().describe('Target language code, such as "ru" or "pt-BR". It names the suggested file, such as signup.ru.json.'),
        prefix: z
          .union([z.string(), z.literal(false)])
          .optional()
          .describe(
            'Prefix of derived translation keys, such as "signup" for keys like signup.title. Defaults to the form id. Pass false to list only the explicit keys from i18n objects.',
          ),
        catalog: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            'Locale catalog the app passes as locale, such as the contents of @formhaus/core/locales/ru.json. Its messages and labels are left out of the overlay; catalog in the result lists its missing and unknown keys.',
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
        'Call this first, before writing or editing a definition, for the full reference of what a definition supports; example_definitions gives whole working forms to copy instead. Lists what a Formhaus definition supports: field types (including scale, rating and picture options), sections (including matrix), repeatable groups, field props, validation rules, condition operators, step and route semantics, actions, translation (lang, messages, labels, i18n keys, overlay addresses) and adapters. To check a finished definition, call validate_definition instead.',
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

  return server;
}
