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

  it('validates and submits section fields as flat keys', async () => {
    const engine = new FormEngine(single, { company: true, people: [{ name: 'Ada' }] });
    expect(engine.validate()).toEqual({ street: 'This field is required' });
    engine.setValue('street', ' Main ');
    const submit = vi.fn();
    expect(await engine.submit(submit)).toBe(true);
    expect(submit.mock.calls[0][0]).toEqual({ company: true, street: 'Main', people: [{ name: 'Ada', diet: 'none' }] });
  });
});

describe('groups', () => {
  it('starts with defaultItems items holding item defaults', () => {
    const engine = new FormEngine(single);
    expect(engine.values.people).toEqual([{ diet: 'none' }]);
    expect(engine.items('people')[0].fields.map((field) => field.key)).toEqual(['name', 'email', 'confirm', 'diet']);
  });

  it('adds and removes items within the limits', () => {
    const engine = new FormEngine(single);
    expect(engine.removeItem('people', 0)).toBe(false);
    expect(engine.addItem('people')).toBe(true);
    expect(engine.addItem('people')).toBe(true);
    expect(engine.addItem('people')).toBe(false);
    expect(engine.values.people).toHaveLength(3);
    expect(engine.removeItem('people', 5)).toBe(false);
    expect(engine.removeItem('people', 1)).toBe(true);
    expect(engine.values.people).toHaveLength(2);
    expect(engine.addItem('missing')).toBe(false);
  });

  it('keeps item ids stable when an earlier item is removed', () => {
    const engine = new FormEngine(single, { people: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] });
    const ids = engine.items('people').map((item) => item.id);
    engine.setItemValue('people', 2, 'name', 'C2');
    expect(engine.items('people').map((item) => item.id)).toEqual(ids);
    engine.removeItem('people', 0);
    expect(engine.items('people').map((item) => item.id)).toEqual(ids.slice(1));
  });

  it('validates every item and reports errors by path', () => {
    const engine = new FormEngine(single, { people: [{ name: 'Ada', email: 'a@x.io', confirm: 'b@x.io' }, { diet: 'other' }] });
    expect(engine.validate()).toEqual({
      'people.0.confirm': 'Fields must match',
      'people.1.name': 'This field is required',
      'people.1.dietNote': 'This field is required',
    });
    engine.setValue('people.0.email', 'b@x.io');
    expect(engine.errors).not.toHaveProperty('people.0.confirm');
    expect(engine.validateField('people.1.name')).toBe('This field is required');
    expect(engine.validateField('people.1.vat')).toBeNull();
  });

  it('reports count rules under the group key', () => {
    const engine = new FormEngine(
      { ...single, fields: [{ ...people, defaultItems: 0, validation: { minLength: 2, maxLength: 3 } }] },
      { people: [{ name: 'A' }] },
    );
    expect(engine.validate()).toEqual({ people: 'Must be at least 2 items' });
    const required = new FormEngine({ ...single, fields: [{ ...people, defaultItems: 0 }] });
    expect(required.validate()).toEqual({ people: 'This field is required' });
  });

  it('shifts item errors when an earlier item is removed', () => {
    const engine = new FormEngine(single, { people: [{}, { name: 'B' }, {}] });
    engine.validate();
    expect(Object.keys(engine.errors)).toEqual(['people.0.name', 'people.2.name']);
    engine.removeItem('people', 0);
    expect(engine.errors).toEqual({ 'people.1.name': 'This field is required' });
  });

  it('clears hidden item fields and their errors', () => {
    const engine = new FormEngine(single, { people: [{ name: 'A', diet: 'other' }] });
    engine.validate();
    expect(engine.errors).toHaveProperty(['people.0.dietNote']);
    engine.setItemValue('people', 0, 'dietNote', 'Vegan');
    engine.setItemValue('people', 0, 'diet', 'none');
    expect(engine.values.people).toEqual([{ name: 'A', diet: 'none' }]);
    expect(engine.errors).toEqual({});
  });

  it('evaluates item conditions against outer fields', () => {
    const engine = new FormEngine(single, { company: true, street: 'S', people: [{ name: 'A', vat: 'NL1' }] });
    expect(engine.items('people')[0].fields.map((field) => field.key)).toContain('vat');
    engine.setValue('company', false);
    expect(engine.values.people).toEqual([{ name: 'A', diet: 'none' }]);
    expect(engine.items('people')[0].fields.map((field) => field.key)).not.toContain('vat');
  });

  it('submits cleaned and trimmed item objects', async () => {
    const engine = new FormEngine(single, { people: [{ name: ' Ada ', diet: 'none', extra: 1 }] });
    const submit = vi.fn();
    expect(await engine.submit(submit)).toBe(true);
    expect(submit.mock.calls[0][0]).toEqual({ people: [{ name: 'Ada', diet: 'none' }] });
    expect(engine.values.people).toEqual([{ name: ' Ada ', diet: 'none', extra: 1 }]);
  });

  it('lets outer conditions test the group with notEmpty', () => {
    const engine = new FormEngine({ ...single, fields: [{ ...people, defaultItems: 0, validation: {} }, single.fields![3]] });
    expect(engine.visibleFields.map((field) => field.key)).toEqual(['people']);
    engine.addItem('people');
    expect(engine.visibleFields.map((field) => field.key)).toEqual(['people', 'summary']);
  });

  it('clears a hidden group and its item errors', () => {
    const definition: FormDefinition = { ...single, fields: [single.fields![0], { ...people, show: [{ field: 'company', eq: true }] }] };
    const engine = new FormEngine(definition, { company: true, people: [{}] });
    engine.validate();
    expect(engine.errors).toHaveProperty(['people.0.name']);
    engine.setValue('company', false);
    expect(engine.values).not.toHaveProperty('people');
    expect(engine.errors).toEqual({});
    expect(engine.items('people')).toEqual([]);
  });

  it('maps server errors to items and keeps them until the item field changes', async () => {
    const engine = new FormEngine(single, { people: [{ name: 'A' }, { name: 'B' }] });
    await engine.submit(() => ({ ok: false, errors: { 'people.1.name': 'Taken', 'people.7.name': 'Gone', people: 'Too many' } }));
    expect(engine.errors).toEqual({ 'people.1.name': 'Taken', people: 'Too many' });
    expect(engine.topLevelErrors).toEqual(['Gone']);
    engine.setItemValue('people', 0, 'name', 'A2');
    expect(engine.errors).toEqual({ 'people.1.name': 'Taken', people: 'Too many' });
    engine.removeItem('people', 0);
    expect(engine.errors).toEqual({ 'people.0.name': 'Taken' });
    engine.setValue('people.0.name', 'C');
    expect(engine.errors).toEqual({});
  });

  it('accepts paths in setErrors and opens the step with the item error', () => {
    const engine = new FormEngine(wizard, { title: 'T', people: [{ name: 'A' }, { name: 'B' }] });
    engine.setErrors({ 'people.1.name': 'Taken' });
    expect(engine.currentStep?.id).toBe('two');
    expect(engine.stepErrors).toEqual({ two: ['people.1.name'] });
  });

  it('orders step errors by item and field', () => {
    const engine = new FormEngine(wizard, { title: 'T', people: [{ diet: 'other' }, {}] });
    engine.setErrors({ 'people.1.name': 'x', 'people.0.dietNote': 'y', 'people.0.name': 'z', people: 'w' });
    expect(engine.stepErrors.two).toEqual(['people', 'people.0.name', 'people.0.dietNote', 'people.1.name']);
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

  it('ignores writes to missing items, unknown item fields and inactive groups', () => {
    const engine = new FormEngine(single);
    engine.setItemValue('people', 4, 'name', 'A');
    engine.setItemValue('people', 0, 'nope', 'A');
    engine.setValue('people.9.name', 'A');
    expect(engine.values.people).toEqual([{ diet: 'none' }]);
    expect(engine.values).not.toHaveProperty(['people.9.name']);
  });

  it('flags a group value that is not a list of objects', () => {
    const engine = new FormEngine(single, { people: 'Ada' });
    expect(engine.validate()).toEqual({ people: 'Invalid value' });
  });
});
