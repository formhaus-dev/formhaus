import { describe, expect, it, vi } from 'vitest';
import { checkDefinition, FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';
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

  it('warns about optionsDependsOn on an item field', () => {
    const scoped = structuredClone(definition);
    (scoped.fields![2] as { fields: { optionsDependsOn?: string[] }[] }).fields[0].optionsDependsOn = ['note'];
    expect(checkDefinition(scoped).map(({ code, severity }) => `${severity} ${code}`)).toEqual(['warning group-scope']);
  });

  it.each([[['bad', null, 123]], [[{}, new Date(0)]]])('rejects items that are not plain objects like the server: %j', async (items) => {
    const onSubmit = vi.fn();
    const engine = new FormEngine(definition, { people: items });
    expect(engine.getSubmitValues().people).toEqual(items.map((item) => (item?.constructor === Object ? {} : item)));
    expect(await engine.submit(onSubmit)).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(engine.errors).toEqual({ people: 'Invalid value' });
    expect(validateSubmission(definition, { people: items }).errors).toEqual(engine.errors);
  });
});
