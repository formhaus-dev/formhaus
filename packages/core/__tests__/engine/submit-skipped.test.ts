import { expect, it, vi } from 'vitest';
import { FormEngine, type FormDefinition } from '../../src';

const definition: FormDefinition = {
  id: 'wizard',
  title: 'Wizard',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', skip: { label: 'Skip' }, fields: [{ key: 'bio', type: 'text', label: 'Bio' }] },
  ],
};

it('passes skipped step ids to the submit function', async () => {
  const engine = new FormEngine(definition, { name: 'Ada' });
  engine.nextStep();
  const submit = vi.fn();
  await engine.skipStepAsync(submit);
  expect(submit).toHaveBeenCalledWith({ name: 'Ada' }, ['two']);
});

it('does not report a visited empty step as skipped', async () => {
  const engine = new FormEngine(definition, { name: 'Ada' });
  engine.nextStep();
  const submit = vi.fn();
  await engine.submitAsync(submit);
  expect(submit).toHaveBeenCalledWith(expect.any(Object), []);
});
