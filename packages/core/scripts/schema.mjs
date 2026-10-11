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

export function serializeSchema(schema) {
  return `${JSON.stringify(schema, null, 2)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const content = serializeSchema(buildSchema());
  for (const output of SCHEMA_OUTPUTS) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, content);
    console.log(`Wrote ${output}`);
  }
}
