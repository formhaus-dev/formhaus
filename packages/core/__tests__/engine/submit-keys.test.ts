import { describe, expect, it } from 'vitest';
import { FormEngine, type FormDefinition } from '../../src';
import { localize } from '../../src/i18n';
import { validateSubmission } from '../../src/server';

const KEYS = ['contact.email', 'first-name', 'last_name', 'field2', 'camelCase', 'имя', 'Größe', 'a.b.c'] as const;

const definition: FormDefinition = {
  id: 'keys',
  title: 'Keys',
  submit: { label: 'Send' },
  fields: KEYS.map((key) => ({ key, type: 'text', label: `Label ${key}`, validation: { required: true } })),
};
const answers = Object.fromEntries(KEYS.map((key) => [key, `value of ${key}`]));

describe('submitted keys', () => {
  it('submits each value under its key exactly as written, never nested', async () => {
    const engine = new FormEngine(definition, answers);
    expect(Object.keys(engine.getSubmitValues())).toEqual([...KEYS]);
    let submitted: Record<string, unknown> | undefined;
    expect(
      await engine.submit(async (values) => {
        submitted = values;
      }),
    ).toBe(true);
    expect(submitted).toEqual(answers);
    expect(submitted).not.toHaveProperty('contact');
    expect(submitted).not.toHaveProperty('a');
  });

  it('reports client errors under the same keys', async () => {
    const engine = new FormEngine(definition);
    expect(await engine.submit(async () => {})).toBe(false);
    expect(Object.keys(engine.errors)).toEqual([...KEYS]);
  });

  it('keeps the keys in validateSubmission values and errors', () => {
    expect(validateSubmission(definition, answers)).toEqual({ values: answers, errors: {} });
    expect(Object.keys(validateSubmission(definition, {}).errors)).toEqual([...KEYS]);
  });

  it('keeps the keys when the form is localized', () => {
    const overlay = { fields: Object.fromEntries(KEYS.map((key) => [key, { label: `Перевод ${key}` }])) };
    const localized = localize(definition, { overlay }).definition;
    expect(localized.fields!.map((field) => field.key)).toEqual([...KEYS]);
    expect(localized.fields!.map((field) => field.label)).toEqual(KEYS.map((key) => `Перевод ${key}`));
    expect(localize(definition, { translate: () => 'Перевод' }).definition.fields!.map((field) => field.key)).toEqual([...KEYS]);
  });
});
