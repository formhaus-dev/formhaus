import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src';
import type { FormDefinition, FormGroup } from '../../src/types';

const people: FormGroup = {
  key: 'people',
  type: 'group',
  label: 'People',
  itemLabel: 'Person {index}',
  defaultItems: 1,
  validation: { required: true, maxLength: 3 },
  fields: [
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'confirm', type: 'email', label: 'Confirm', validation: { matchField: 'email' } },
    {
      key: 'diet',
      type: 'select',
      label: 'Diet',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'other', label: 'Other' },
      ],
    },
    { key: 'dietNote', type: 'text', label: 'Details', show: [{ field: 'diet', eq: 'other' }], validation: { required: true } },
  ],
};

const vat = { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', eq: true }] };
const single: FormDefinition = {
  formatVersion: '1.1',
  id: 'event',
  title: 'Event',
  submit: { label: 'Send' },
  fields: [
    { key: 'company', type: 'checkbox', label: 'Company' },
    {
      key: 'billing',
      type: 'section',
      title: 'Billing',
      show: [{ field: 'company', eq: true }],
      fields: [{ key: 'street', type: 'text', label: 'Street', validation: { required: true } }],
    },
    { ...people, fields: [...people.fields, vat] },
    { key: 'summary', type: 'text', label: 'Summary', show: [{ field: 'people', notEmpty: true }] },
  ],
};

const wizard: FormDefinition = {
  formatVersion: '1.1',
  id: 'wizard',
  title: 'Wizard',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'title', type: 'text', label: 'Title' }] },
    { id: 'two', title: 'Two', skip: { label: 'Skip' }, fields: [{ ...people, defaultItems: 2 }] },
  ],
};

describe('sections', () => {
  it('hides and clears the fields of a hidden section', () => {
    const engine = new FormEngine(single, { company: true, street: 'Main' });
    expect(engine.visibleFields.map((field) => field.key)).toEqual(['company', 'street', 'people', 'summary']);
    expect(engine.visibleNodes.map((node) => node.key)).toEqual(['company', 'billing', 'people', 'summary']);
    engine.setValue('company', false);
    expect(engine.values).not.toHaveProperty('street');
    expect(engine.visibleNodes.map((node) => node.key)).toEqual(['company', 'people', 'summary']);
  });
});

describe('groups', () => {
  it('starts with defaultItems items holding item defaults', () => {
    const engine = new FormEngine(single);
    expect(engine.values.people).toEqual([{ diet: 'none' }]);
    expect(engine.items('people')[0].fields.map((field) => field.key)).toEqual(['name', 'email', 'confirm', 'diet']);
  });

  it('keeps item ids stable when an earlier item is removed', () => {
    const engine = new FormEngine(single, { people: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] });
    const ids = engine.items('people').map((item) => item.id);
    engine.setItemValue('people', 2, 'name', 'C2');
    expect(engine.items('people').map((item) => item.id)).toEqual(ids);
    engine.removeItem('people', 0);
    expect(engine.items('people').map((item) => item.id)).toEqual(ids.slice(1));
  });

  it('shifts item errors when an earlier item is removed', () => {
    const engine = new FormEngine(single, { people: [{}, { name: 'B' }, {}] });
    engine.validate();
    expect(Object.keys(engine.errors)).toEqual(['people.0.name', 'people.2.name']);
    engine.removeItem('people', 0);
    expect(engine.errors).toEqual({ 'people.1.name': 'This field is required' });
  });

  it('evaluates item conditions against outer fields', () => {
    const engine = new FormEngine(single, { company: true, street: 'S', people: [{ name: 'A', vat: 'NL1' }] });
    expect(engine.items('people')[0].fields.map((field) => field.key)).toContain('vat');
    engine.setValue('company', false);
    expect(engine.values.people).toEqual([{ name: 'A', diet: 'none' }]);
    expect(engine.items('people')[0].fields.map((field) => field.key)).not.toContain('vat');
  });

  it('blocks Continue on item errors and resets items on skip', async () => {
    const engine = new FormEngine({ ...wizard, steps: [wizard.steps![1], wizard.steps![0]] });
    expect(engine.canGoNext).toBe(false);
    expect(await engine.next()).toBe(false);
    expect(Object.keys(engine.errors)).toEqual(['people.0.name', 'people.1.name']);
    expect(await engine.skip()).toBe(true);
    expect(engine.errors).toEqual({});
    expect(engine.values.people).toEqual([{ diet: 'none' }, { diet: 'none' }]);
    expect(engine.getSubmitValues()).toEqual({});
  });

  it('notifies the group and the path on item changes', () => {
    const engine = new FormEngine(single);
    const group = vi.fn();
    const path = vi.fn();
    engine.subscribeField('people', group);
    engine.subscribeField('people.0.name', path);
    engine.setItemValue('people', 0, 'name', 'A');
    expect(group).toHaveBeenCalledTimes(1);
    expect(path).toHaveBeenCalledTimes(1);
  });
});
