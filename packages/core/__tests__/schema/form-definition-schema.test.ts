import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { SCHEMA_OUTPUTS, buildSchema } from '../../scripts/schema.mjs';

const repoRoot = resolve(__dirname, '../../../..');
const jsonFiles = (dir: string) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => resolve(dir, name));
const examples = [
  ...jsonFiles(resolve(repoRoot, 'examples/definitions')),
  ...jsonFiles(resolve(repoRoot, 'packages/core/fixtures')),
  ...jsonFiles(resolve(repoRoot, 'docs/recipes/definitions')),
  resolve(repoRoot, 'examples/react-quiz/src/quiz.json'),
];

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(readJson(SCHEMA_OUTPUTS[0]));

const validDefinition = () => ({
  id: 'form',
  title: 'Form',
  submit: { label: 'Submit' },
  steps: [
    {
      id: 'one',
      title: 'One',
      fields: [{ key: 'name', type: 'text', label: 'Name' }],
      routes: [{ to: null }],
    },
  ],
});

describe('form definition JSON Schema', () => {
  it('matches the TypeScript types', () => {
    const expected = buildSchema();
    for (const output of SCHEMA_OUTPUTS) {
      expect(readJson(output), `${output} is stale, run pnpm --filter @formhaus/core schema`).toEqual(expected);
    }
  }, 60_000);

  it.each(examples.map((path) => [relative(repoRoot, path), path]))('accepts %s', (_name, path) => {
    expect(validate(readJson(path)), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts a minimal definition', () => {
    expect(validate(validDefinition())).toBe(true);
  });

  it('accepts a $schema reference', () => {
    expect(validate({ $schema: 'https://formhaus.dev/schema/form-definition.json', ...validDefinition() })).toBe(true);
  });

  it('rejects a definition without id', () => {
    const { id: _id, ...definition } = validDefinition();
    expect(validate(definition)).toBe(false);
  });

  it('accepts a custom field type', () => {
    const definition = validDefinition();
    definition.steps[0].fields[0].type = 'colorpicker';
    expect(validate(definition)).toBe(true);
  });

  it('rejects a non-string field type', () => {
    const definition = validDefinition();
    Object.assign(definition.steps[0].fields[0], { type: 42 });
    expect(validate(definition)).toBe(false);
  });

  it('rejects a route without to', () => {
    const definition = validDefinition();
    definition.steps[0].routes = [{} as { to: null }];
    expect(validate(definition)).toBe(false);
  });

  it('rejects unknown properties', () => {
    expect(validate({ ...validDefinition(), layout: 'grid' })).toBe(false);
  });
});
