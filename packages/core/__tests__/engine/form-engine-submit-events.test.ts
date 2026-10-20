import { describe, expect, it } from 'vitest';
import type { FormDefinition, FormEvent } from '../../src';
import { CloudError } from '../../src/cloud';
import { FormEngine } from '../../src/engine';

const definition: FormDefinition = {
  id: 'events',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City', validation: { required: true } }] },
  ],
};

async function lastStep(values: Record<string, unknown>) {
  const events: FormEvent[] = [];
  const engine = new FormEngine(definition, values, { onFormEvent: (event) => events.push(event) });
  engine.start();
  await engine.next();
  events.length = 0;
  return { engine, events };
}

describe('submit events', () => {
  it('closes the last step with form_submitted and no step_completed', async () => {
    const { engine, events } = await lastStep({ name: 'Ada', city: 'Oslo' });
    await engine.submit(() => {});
    expect(events).toEqual([{ type: 'form_submitted', fieldCount: 2 }, { type: 'form_submit_succeeded' }]);
  });

  it('reports a submit that fails validation on the last step', async () => {
    const { engine, events } = await lastStep({ name: 'Ada' });
    await engine.submit(() => {});
    expect(events).toEqual([
      { type: 'form_submit_failed', reason: 'validation' },
      { type: 'field_error', fieldKey: 'city', error: 'This field is required' },
    ]);
  });

  it('reports a rejected submit', async () => {
    const { engine, events } = await lastStep({ name: 'Ada', city: 'Oslo' });
    await engine.submit(() => ({ ok: false, errors: { city: 'Unknown city' } }));
    expect(events).toEqual([
      { type: 'form_submitted', fieldCount: 2 },
      { type: 'form_submit_failed', reason: 'rejected' },
      { type: 'field_error', fieldKey: 'city', error: 'Unknown city' },
    ]);
  });

  it.each([
    ['a network error', new CloudError({ status: 0, code: 'network' }), { status: 0 }],
    ['a server error', new CloudError({ status: 503, code: 'unavailable' }), { status: 503 }],
    ['an error without a status', new Error('boom'), {}],
  ])('reports %s with its status', async (_, error, extra) => {
    const { engine, events } = await lastStep({ name: 'Ada', city: 'Oslo' });
    await expect(
      engine.submit(() => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(events).toEqual([
      { type: 'form_submitted', fieldCount: 2 },
      { type: 'form_submit_failed', reason: 'error', ...extra },
    ]);
  });
});
