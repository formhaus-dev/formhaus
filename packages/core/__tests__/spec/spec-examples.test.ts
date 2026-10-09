import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { FormEngine, validateDefinition } from '../../src';
import type { FormField, FormStep } from '../../src';
import { SCHEMA_OUTPUTS } from '../../scripts/schema.mjs';

const specPath = resolve(__dirname, '../../../../docs/spec.md');
const spec = readFileSync(specPath, 'utf8');
const blocks = [...spec.matchAll(/^```json\n([\s\S]*?)^```$/gm)].map((match) => match[1]);
const schema = JSON.parse(readFileSync(SCHEMA_OUTPUTS[0], 'utf8'));
const definitions = blocks.map((block) => JSON.parse(block));
const example = definitions.find((definition) => definition.id === 'account-application');
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

describe('specification examples', () => {
  it('contains json examples and the complete example', () => {
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(example).toBeDefined();
  });

  it.each(blocks.map((block, index) => [index + 1, block]))('example %i is a valid definition', (_index, block) => {
    const definition = JSON.parse(block);
    expect(validate(definition), JSON.stringify(validate.errors)).toBe(true);
    expect(validateDefinition(definition)).toEqual([]);
    expect(() => new FormEngine(definition)).not.toThrow();
  });

  it.each(definitions.map((definition) => [definition.id, definition]))('%s has no unreachable length messages', (_id, definition) => {
    const fields = [...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step: FormStep) => step.fields)];
    const unreachable = fields.filter(({ validation }: FormField) => (validation?.minLength ?? 2) <= 1 && !validation?.required);
    expect(unreachable.map(({ key }: FormField) => key)).toEqual([]);
  });

  it('follows the routes described for the complete example', () => {
    const engine = new FormEngine(example, { accountType: 'personal', company: 'Acme' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'contact', 'newsletter']);
    expect(engine.getSubmitValues()).not.toHaveProperty('company');
    engine.setValue('accountType', 'waitlist');
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind']);
    expect(engine.isLastStep).toBe(true);
  });

  it('omits skipped newsletter answers from the complete example payload', async () => {
    const values = {
      accountType: 'personal', name: 'Ada', email: 'a@b.co', confirmEmail: 'a@b.co', terms: true, subscribe: true, topics: ['events'],
    };
    const engine = new FormEngine(example, values);
    let submitted: Record<string, unknown> | undefined;
    for (let step = 0; step < 3; step++) expect(engine.nextStep()).toBe(true);
    expect(engine.currentStep?.id).toBe('newsletter');
    expect(await engine.skipStepAsync((payload) => { submitted = payload; })).toBe(true);
    expect(submitted).toMatchObject({ name: 'Ada', terms: true });
    expect(submitted).not.toHaveProperty('subscribe');
    expect(submitted).not.toHaveProperty('topics');
  });
});
