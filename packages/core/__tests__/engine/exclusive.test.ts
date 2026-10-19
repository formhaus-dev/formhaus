import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine, type FieldOption, type FormDefinition, type FormNode } from '../../src';
import { textSlots } from '../../src/i18n';

const conditions: FieldOption[] = [
  { value: 'asthma', label: 'Asthma' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'none', label: 'None of these', exclusive: true },
];

const field: FormNode = { key: 'conditions', type: 'multiselect', label: 'Do you have any of these conditions?', options: conditions };

const single = (extra: Partial<FormNode> = {}): FormDefinition => ({
  formatVersion: '1.5',
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields: [{ ...field, ...extra } as FormNode],
});

describe('exclusive options', () => {
  it('writes a list without a newly picked exclusive option as given', () => {
    const engine = new FormEngine(single());
    const value = ['asthma', 'diabetes'];
    engine.setValue('conditions', value);
    expect(engine.values.conditions).toBe(value);
    engine.setValue('conditions', []);
    expect(engine.values.conditions).toEqual([]);
  });

  it('ignores exclusive on a field with optionsFrom', () => {
    const engine = new FormEngine(single({ optionsFrom: 'conditions' }), {}, { onWarning: () => {} });
    engine.setValue('conditions', ['asthma', 'none']);
    expect(engine.values.conditions).toEqual(['asthma', 'none']);
    expect(engine.validate()).toEqual({});
  });

  it('rejects exclusive that is not a boolean', () => {
    const options = [conditions[0], { ...conditions[2], exclusive: 'yes' }] as unknown as FieldOption[];
    expect(checkDefinition(single({ options })).map(({ code, path }) => ({ code, path }))).toEqual([
      { code: 'invalid-type', path: '/fields/0/options/1/exclusive' },
    ]);
  });

  it('lists the or label only for forms with exclusive options', () => {
    const labels = (definition: FormDefinition) => textSlots(definition).filter(({ address }) => address === 'labels.or');
    expect(labels(single())).toEqual([expect.objectContaining({ text: 'or' })]);
    expect(labels(single({ options: conditions.slice(0, 2) }))).toEqual([]);
  });

  it('explains the outdated format version', () => {
    const [issue] = checkDefinition({ ...single(), formatVersion: '1.4' });
    expect(issue.message).toBe(
      '/formatVersion: /fields/0 has an exclusive option, which needs format 1.5. Set "formatVersion": "1.5". Older versions of @formhaus/core ignore "exclusive". Upgrade the server that runs validateSubmission() first.',
    );
  });
});
