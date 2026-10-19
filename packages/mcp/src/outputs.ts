import { z } from 'zod';

const issue = z.object({
  code: z.string(),
  severity: z.enum(['error', 'warning']),
  path: z.string().describe('JSON pointer to the node, such as /steps/0/fields/1/show/0/field.'),
  message: z.string().describe('"<path>: <what is wrong>. <how to fix>."'),
  hint: z.string().optional(),
  fixes: z
    .array(
      z.object({
        title: z.string(),
        safe: z
          .boolean()
          .describe('true when applying the patch only repairs the issue and changes nothing else. fix_definition applies these.'),
        patch: z
          .array(z.record(z.string(), z.unknown()))
          .describe('RFC 6902 JSON Patch operations (add, replace, remove, move) with JSON pointer paths.'),
      }),
    )
    .optional()
    .describe('Ready repairs for this issue. Apply one patch to the definition, then validate again.'),
});

export const validationOutput = {
  valid: z.boolean().describe('false when at least one issue has severity "error".'),
  issues: z.array(issue).describe('Errors first, then warnings. Fix every error at its path and validate again.'),
};

export const fixOutput = {
  ...validationOutput,
  definition: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('The definition with every safe fix applied. Missing when the input is not a JSON object.'),
  applied: z
    .array(z.object({ code: z.string(), path: z.string(), title: z.string() }))
    .describe('Fixes applied, in order. path is where the issue was before the fix.'),
  issues: z
    .array(issue)
    .describe(
      'Issues left after the safe fixes. Errors first, then warnings. Fix them by hand or apply one of their unsafe fixes after checking it.',
    ),
};

const trace = z.object({
  action: z.enum(['next', 'back', 'skip']),
  from: z.string().nullable(),
  to: z.string().nullable(),
  moved: z.boolean(),
  submitted: z.boolean().optional(),
  reason: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional(),
});

export const simulationOutput = {
  ok: z.boolean(),
  validation: z.object(validationOutput),
  multiStep: z.boolean().optional(),
  path: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        visited: z.boolean(),
        skipped: z.boolean(),
        visibleFields: z
          .array(z.string())
          .describe('Visible field keys. Item fields of groups are listed as paths, such as participants.0.email.'),
      }),
    )
    .optional(),
  currentStep: z.object({ id: z.string(), title: z.string(), index: z.number() }).nullable().optional(),
  isLastStep: z.boolean().optional(),
  trace: z.array(trace).optional(),
  errors: z.record(z.string(), z.string()).optional().describe('Errors by field key, or by item path such as participants.0.email.'),
  wouldSubmit: z.boolean().optional(),
  submitValues: z.record(z.string(), z.unknown()).optional(),
  overlayIssues: z.array(z.string()).optional().describe('Overlay entries that were ignored or do not match the source.'),
};

export const examplesOutput = {
  examples: z.array(z.object({ id: z.string(), title: z.string(), shows: z.string() })).optional(),
  definition: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
};

export const capabilitiesOutput = {
  definition: z.record(z.string(), z.unknown()),
  fieldTypes: z.array(z.string()),
  customFieldTypes: z.string(),
  containerTypes: z.array(z.string()),
  sections: z.record(z.string(), z.unknown()),
  groups: z.record(z.string(), z.unknown()),
  fieldTypeNotes: z.record(z.string(), z.string()),
  fieldProps: z.record(z.string(), z.unknown()),
  validationRules: z.record(z.string(), z.unknown()),
  conditions: z.record(z.string(), z.unknown()),
  recall: z.record(z.string(), z.unknown()),
  steps: z.record(z.string(), z.unknown()),
  actions: z.record(z.string(), z.unknown()),
  i18n: z.record(z.string(), z.unknown()).optional(),
  adapters: z.array(z.object({ name: z.string(), description: z.string() })),
};

export const templateOutput = {
  ok: z.boolean(),
  validation: z.object(validationOutput),
  lang: z.string().optional(),
  file: z.string().optional().describe('Suggested file name, such as signup.ru.json.'),
  overlay: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Translation skeleton with the source texts as values. Replace the values, keep the nesting.'),
  slots: z
    .array(z.object({ address: z.string(), key: z.string().optional(), text: z.string(), params: z.array(z.string()), hash: z.string() }))
    .optional(),
};

const cloudFields = {
  error: z.string().optional().describe('Machine-readable error code or message when the call failed.'),
  message: z.string().optional(),
  form_id: z.string().optional(),
  notice: z.string().optional(),
};

export const cloudOutput = z.looseObject(cloudFields);

export const revealOutput = z.looseObject({ ...cloudFields, webhook_secret: z.string().optional() });
