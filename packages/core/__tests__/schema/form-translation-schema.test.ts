import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { TRANSLATION_SCHEMA_OUTPUTS, buildTranslationSchema } from '../../scripts/schema.mjs';
import { translationTemplate } from '../../src/i18n';
import { ru, signup } from '../i18n/fixtures';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const validate = new Ajv({ allErrors: true }).compile(readJson(TRANSLATION_SCHEMA_OUTPUTS[0]));

describe('translation overlay JSON Schema', () => {
  it('is up to date', () => {
    const expected = buildTranslationSchema();
    for (const output of TRANSLATION_SCHEMA_OUTPUTS)
      expect(readJson(output), `${output} is stale, run pnpm --filter @formhaus/core schema`).toEqual(expected);
  }, 60_000);

  it('accepts overlays and generated templates', () => {
    expect(validate(ru), JSON.stringify(validate.errors)).toBe(true);
    expect(validate(translationTemplate(signup)), JSON.stringify(validate.errors)).toBe(true);
  });

  it('rejects non-string leaves, unknown texts and unknown catalog keys', () => {
    expect(validate({ title: 5 })).toBe(false);
    expect(validate({ fields: { email: { label: 'x', hint: 'y' } } })).toBe(false);
    expect(validate({ messages: { requried: 'x' } })).toBe(false);
    expect(validate({ steps: { one: { fields: { a: { options: { '0': ['x'] } } } } } })).toBe(false);
  });
});
