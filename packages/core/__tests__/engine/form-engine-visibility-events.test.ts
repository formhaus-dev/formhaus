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
