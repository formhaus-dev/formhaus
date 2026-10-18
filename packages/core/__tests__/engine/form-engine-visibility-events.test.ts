import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition, FormEngineOptions, FormEvent } from '../../src';
import { FormEngine } from '../../src/engine';

const definition: FormDefinition = {
  id: 'visibility',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      title: 'One',
      fields: [
        { key: 'company', type: 'checkbox', label: 'Company' },
        { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', eq: true }] },
      ],
    },
    {
      id: 'two',
      title: 'Two',
      fields: [
        {
          key: 'people',
          type: 'group',
          label: 'People',
          fields: [
            { key: 'role', type: 'text', label: 'Role' },
            { key: 'email', type: 'text', label: 'Email', show: [{ field: 'role', eq: 'lead' }] },
          ],
        },
      ],
    },
  ],
};

function setup() {
  const events: FormEvent[] = [];
  const engine = new FormEngine(definition, {}, { onFormEvent: (event) => events.push(event) });
  engine.start();
  events.length = 0;
  return { engine, events };
}

const visibility = (events: FormEvent[]) => events.filter((event) => event.type === 'field_shown' || event.type === 'field_hidden');

describe('field visibility events', () => {
  it('reports a field when its condition result changes', () => {
    const { engine, events } = setup();
    engine.setValue('company', true);
    engine.setValue('company', true);
    engine.setValue('company', false);
    expect(events).toEqual([
      { type: 'field_shown', fieldKey: 'vat' },
      { type: 'field_hidden', fieldKey: 'vat' },
    ]);
  });

  it('reports nothing for a step change', async () => {
    const { engine, events } = setup();
    expect(await engine.next()).toBe(true);
    expect(await engine.back()).toBe(true);
    engine.goToStepWithField('people');
    expect(visibility(events)).toEqual([]);
    expect(events.map((event) => event.type)).toEqual(['step_completed', 'step_viewed', 'step_viewed', 'step_viewed']);
  });

  it('reports group item fields by path and ignores added and removed items', () => {
    const { engine, events } = setup();
    engine.addItem('people');
    engine.addItem('people');
    engine.setItemValue('people', 1, 'role', 'lead');
    engine.removeItem('people', 0);
    engine.setItemValue('people', 0, 'role', 'dev');
    expect(events).toEqual([
      { type: 'field_shown', fieldKey: 'people.1.email' },
      { type: 'field_hidden', fieldKey: 'people.0.email' },
    ]);
  });

  it('reports nothing before start', () => {
    const events: FormEvent[] = [];
    const engine = new FormEngine(definition, {}, { onFormEvent: (event) => events.push(event) });
    engine.setValue('company', true);
    engine.reset();
    expect(events).toEqual([]);
  });

  it('skips the visibility check without a handler', () => {
    const engine = new FormEngine(definition, {});
    const check = vi.spyOn((engine as unknown as { visibility: { conditionResults: () => unknown } }).visibility, 'conditionResults');
    engine.start();
    engine.setValue('company', true);
    engine.reset();
    expect(check).not.toHaveBeenCalled();
  });
});

describe('field visibility events for every condition form', () => {
  const forms: FormDefinition = {
    id: 'forms',
    title: '',
    submit: { label: 'Send' },
    fields: [
      { key: 'plan', type: 'text', label: 'Plan' },
      {
        key: 'seats',
        type: 'number',
        label: 'Seats',
        showAny: [
          { field: 'plan', eq: 'team' },
          { field: 'plan', eq: 'pro' },
        ],
      },
      {
        key: 'billing',
        type: 'section',
        title: 'Billing',
        show: [{ field: 'plan', eq: 'pro' }],
        fields: [{ key: 'iban', type: 'text', label: 'IBAN' }],
      },
      {
        key: 'admin',
        type: 'section',
        title: 'Admin',
        showAny: [{ field: 'plan', eq: 'team' }],
        fields: [{ key: 'owner', type: 'text', label: 'Owner' }],
      },
      {
        key: 'members',
        type: 'group',
        label: 'Members',
        showAny: [{ field: 'plan', eq: 'team' }],
        fields: [
          { key: 'role', type: 'text', label: 'Role' },
          { key: 'phone', type: 'text', label: 'Phone', showAny: [{ field: 'role', eq: 'lead' }] },
        ],
      },
    ],
  };

  it('reports fields shown and hidden by show, showAny and section conditions', () => {
    const events: FormEvent[] = [];
    const engine = new FormEngine(forms, {}, { onFormEvent: (event) => events.push(event) });
    engine.start();
    events.length = 0;
    engine.setValue('plan', 'team');
    engine.setValue('plan', 'pro');
    engine.setValue('plan', '');
    expect(events).toEqual([
      { type: 'field_shown', fieldKey: 'seats' },
      { type: 'field_shown', fieldKey: 'owner' },
      { type: 'field_shown', fieldKey: 'members' },
      { type: 'field_shown', fieldKey: 'iban' },
      { type: 'field_hidden', fieldKey: 'owner' },
      { type: 'field_hidden', fieldKey: 'members' },
      { type: 'field_hidden', fieldKey: 'seats' },
      { type: 'field_hidden', fieldKey: 'iban' },
    ]);
  });

  it('reports group item fields with showAny', () => {
    const events: FormEvent[] = [];
    const engine = new FormEngine(forms, { plan: 'team' }, { onFormEvent: (event) => events.push(event) });
    engine.start();
    engine.addItem('members');
    events.length = 0;
    engine.setItemValue('members', 0, 'role', 'lead');
    engine.setItemValue('members', 0, 'role', 'dev');
    expect(events).toEqual([
      { type: 'field_shown', fieldKey: 'members.0.phone' },
      { type: 'field_hidden', fieldKey: 'members.0.phone' },
    ]);
  });

  it('baselines a handler attached after start', () => {
    const events: FormEvent[] = [];
    const options: FormEngineOptions = {};
    const engine = new FormEngine(definition, {}, options);
    engine.start();
    engine.setValue('company', true);
    options.onFormEvent = (event) => events.push(event);
    engine.setValue('company', false);
    expect(visibility(events)).toEqual([{ type: 'field_hidden', fieldKey: 'vat' }]);
  });

  it('rebaselines a handler attached again after removal', () => {
    const { engine, events } = setup();
    const options = (engine as unknown as { lifecycle: FormEngineOptions }).lifecycle;
    const handler = options.onFormEvent;
    options.onFormEvent = undefined;
    engine.setValue('company', true);
    options.onFormEvent = handler;
    engine.setValue('company', false);
    expect(visibility(events)).toEqual([{ type: 'field_hidden', fieldKey: 'vat' }]);
  });
});
