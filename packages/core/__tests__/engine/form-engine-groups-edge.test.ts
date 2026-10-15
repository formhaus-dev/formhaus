import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine } from '../../src';
import type { FormDefinition } from '../../src/types';

const definition: FormDefinition = {
  formatVersion: '1.1',
  id: 'edge',
  title: 'Edge',
  submit: { label: 'Send' },
  fields: [
    { key: 'company', type: 'checkbox', label: 'Company' },
    { key: 'email', type: 'email', label: 'Email' },
    {
      key: 'people',
      type: 'group',
      label: 'People',
      fields: [
        {
          key: 'diet',
          type: 'select',
          label: 'Diet',
          options: [
            { value: 'none', label: 'None' },
            { value: 'other', label: 'Other' },
          ],
        },
        { key: 'note', type: 'text', label: 'Note', show: [{ field: 'diet', eq: 'other' }] },
        { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', eq: true }] },
        { key: 'confirm', type: 'email', label: 'Confirm', validation: { matchField: 'email' } },
      ],
    },
  ],
};

describe('group edge cases', () => {
  it('keeps item ids when hidden item fields are cleared', () => {
    const engine = new FormEngine(definition, { company: true, people: [{ diet: 'other', note: 'x', vat: 'NL' }, { vat: 'DE' }] });
    const ids = engine.items('people').map((item) => item.id);
    engine.setItemValue('people', 0, 'diet', 'none');
    engine.setValue('company', false);
    expect(engine.values.people).toEqual([{ diet: 'none' }, {}]);
    expect(engine.items('people').map((item) => item.id)).toEqual(ids);
  });

  it('clears an item match error when the outer field changes to match', () => {
    const engine = new FormEngine(definition, { email: 'a@x.io', people: [{ confirm: 'b@x.io' }] });
    expect(engine.validate()).toEqual({ 'people.0.confirm': 'Fields must match' });
    engine.setValue('email', 'b@x.io');
    expect(engine.errors).toEqual({});
  });

  it('moves loading flags with their items', () => {
    const engine = new FormEngine(definition, { people: [{}, {}] });
    engine.setFieldLoading('people.1.diet', true);
    engine.removeItem('people', 0);
    expect(engine.fieldLoading).toEqual({ 'people.0.diet': true });
  });

  it('warns about optionsDependsOn on an item field', () => {
    const scoped = structuredClone(definition);
    (scoped.fields![2] as { fields: { optionsDependsOn?: string[] }[] }).fields[0].optionsDependsOn = ['note'];
    expect(checkDefinition(scoped).map(({ code, severity }) => `${severity} ${code}`)).toEqual(['warning group-scope']);
  });
});
