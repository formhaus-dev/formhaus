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

function setup(values: Record<string, unknown> = {}) {
  const events: FormEvent[] = [];
  const engine = new FormEngine(definition, values, { onFormEvent: (event) => events.push(event) });
  return { engine, events };
}

describe('form events', () => {
  it('reports the form and first step once on start', () => {
    const { engine, events } = setup();
    expect(events).toEqual([]);
    engine.start();
    engine.start();
    expect(events).toEqual([{ type: 'form_viewed' }, { type: 'step_viewed', stepId: 'one', stepIndex: 0 }]);
  });

  it('reports every step change in order', async () => {
    const { engine, events } = setup({ name: 'Ada' });
    engine.start();
    await engine.next();
    await engine.skip();
    await engine.back();
    engine.goToStepWithField('name');
    expect(events.slice(2)).toEqual([
      { type: 'step_completed', stepId: 'one' },
      { type: 'step_viewed', stepId: 'two', stepIndex: 1 },
      { type: 'step_skipped', stepId: 'two' },
      { type: 'step_viewed', stepId: 'three', stepIndex: 2 },
      { type: 'step_viewed', stepId: 'two', stepIndex: 1 },
      { type: 'step_viewed', stepId: 'one', stepIndex: 0 },
    ]);
  });

  it('reports field errors when a step fails validation', async () => {
    const { engine, events } = setup();
    expect(await engine.next()).toBe(false);
    expect(events).toEqual([{ type: 'field_error', fieldKey: 'name', error: engine.errors.name }]);
  });

  it('reports submit start and result', async () => {
    const { engine, events } = setup({ name: 'Ada' });
    await engine.submit(() => ({ ok: false, formErrors: ['Closed'] }));
    await expect(
      engine.submit(() => {
        throw new Error('Offline');
      }),
    ).rejects.toThrow('Offline');
    await engine.submit(() => {});
    expect(events.map((event) => ('reason' in event ? `${event.type}:${event.reason}` : event.type))).toEqual([
      'form_submitted',
      'form_submit_failed:rejected',
      'form_submitted',
      'form_submit_failed:error',
      'form_submitted',
      'form_submit_succeeded',
    ]);
    expect(events[0]).toEqual({ type: 'form_submitted', fieldCount: 1 });
  });

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

  it('reports a reset and the current step again', async () => {
    const { engine, events } = setup({ name: 'Ada' });
    engine.start();
    await engine.next();
    events.length = 0;
    engine.reset();
    expect(events).toEqual([{ type: 'form_reset' }, { type: 'step_viewed', stepId: 'one', stepIndex: 0 }]);
    events.length = 0;
    engine.reset();
    expect(events).toEqual([{ type: 'form_reset' }, { type: 'step_viewed', stepId: 'one', stepIndex: 0 }]);
  });
});
