import { describe, expect, it } from 'vitest';
import type { FormDefinition, FormEvent } from '../../src';
import { FormEngine } from '../../src/engine';

const definition: FormDefinition = {
  id: 'events',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] },
    { id: 'two', title: 'Two', skip: { label: 'Skip' }, fields: [{ key: 'plan', type: 'text', label: 'Plan' }] },
    { id: 'three', title: 'Three', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

describe('form events', () => {
  it('reports the skipped last step before the submit', async () => {
    const events: FormEvent[] = [];
    const skipping = new FormEngine(
      { ...definition, steps: definition.steps!.map((step) => (step.id === 'three' ? { ...step, skip: { label: 'Skip' } } : step)) },
      { name: 'Ada' },
      { onFormEvent: (event) => events.push(event) },
    );
    await skipping.next();
    await skipping.next();
    events.length = 0;
    await skipping.skip(() => {});
    expect(events.map((event) => event.type)).toEqual(['step_skipped', 'form_submitted', 'form_submit_succeeded']);
  });
});
