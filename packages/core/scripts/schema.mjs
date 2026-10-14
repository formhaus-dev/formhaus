import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator } from 'ts-json-schema-generator';
import { applyDescriptions } from './schema-descriptions.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const SCHEMA_ID = 'https://formhaus.dev/schema/form-definition.json';

export const SCHEMA_OUTPUTS = [
  resolve(packageRoot, 'schema/form-definition.schema.json'),
  resolve(packageRoot, '../../docs/public/schema/form-definition.json'),
];

export const TRANSLATION_SCHEMA_OUTPUTS = [
  resolve(packageRoot, 'schema/form-translation.schema.json'),
  resolve(packageRoot, '../../docs/public/schema/form-translation.json'),
];

const I18N_DEFINITIONS = ['MessageCatalog', 'LabelCatalog', 'FormI18n', 'StepI18n', 'FieldI18n', 'LabelI18n', 'ValidationI18n'];

export function buildSchema() {
  const generated = createGenerator({
    path: resolve(packageRoot, 'src/types/index.ts'),
    tsconfig: resolve(packageRoot, 'tsconfig.json'),
    type: 'FormDefinition',
    additionalProperties: false,
    skipTypeCheck: true,
    jsDoc: 'none',
  }).createSchema('FormDefinition');

  applyDescriptions(generated.definitions);
  generated.definitions.FormField.properties.key.not = { enum: [...Object.getOwnPropertyNames(Object.prototype), 'prototype'].sort() };
  generated.definitions.FormDefinition.properties.description.maxLength = 1000;
  generated.definitions.FormDefinition.properties.formatVersion.pattern = '^[1-9]\\d*(\\.\\d+)?$';
  generated.definitions.FormDefinition.properties.lang.pattern = '^[A-Za-z]{2,3}([-_][A-Za-z0-9]{2,8})*$';
  for (const name of I18N_DEFINITIONS) {
    for (const property of Object.values(generated.definitions[name].properties)) if (property.type === 'string') property.minLength = 1;
  }
  Object.assign(generated.definitions.ShowCondition, { minProperties: 2, maxProperties: 2 });
  const { FormDefinition, ...definitions } = generated.definitions;

  return {
    $schema: generated.$schema,
    $id: SCHEMA_ID,
    title: 'Formhaus form definition',
    ...FormDefinition,
    properties: { $schema: { type: 'string' }, ...FormDefinition.properties },
    definitions,
  };
}

const text = { type: 'string' };
const texts = (names) => ({ type: 'object', properties: Object.fromEntries(names.map((name) => [name, text])), additionalProperties: false });

export function buildTranslationSchema(definitionSchema = buildSchema()) {
  const names = (name) => Object.keys(definitionSchema.definitions[name].properties);
  const action = texts(['label']);
  const field = texts(['label', 'placeholder', 'helperText']);
  field.properties.options = { type: 'object', additionalProperties: text };
  field.properties.validation = texts(names('ValidationI18n'));
  const fields = { type: 'object', additionalProperties: { $ref: '#/definitions/field' } };
  const step = texts(['title', 'description']);
  Object.assign(step.properties, { next: action, back: action, skip: action, fields });
  const overlay = texts(['title', 'description']);
  Object.assign(overlay.properties, {
    submit: action,
    cancel: action,
    messages: texts(names('MessageCatalog')),
    labels: texts(names('LabelCatalog')),
    fields,
    steps: { type: 'object', additionalProperties: { $ref: '#/definitions/step' } },
  });
  return {
    $schema: definitionSchema.$schema,
    $id: 'https://formhaus.dev/schema/form-translation.json',
    title: 'Formhaus translation overlay',
    description: 'Translated texts of one form in one language, keyed by step id, field key and option value. Every leaf is a string; empty strings fall back to the source text.',
    ...overlay,
    definitions: { field, step },
  };
}

export function serializeSchema(schema) {
  return `${JSON.stringify(schema, null, 2)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const schema = buildSchema();
  const outputs = [[SCHEMA_OUTPUTS, schema], [TRANSLATION_SCHEMA_OUTPUTS, buildTranslationSchema(schema)]];
  for (const [paths, value] of outputs) {
    for (const output of paths) {
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, serializeSchema(value));
      console.log(`Wrote ${output}`);
    }
  }
}
