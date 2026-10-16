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
  await engine.next();
  const submit = vi.fn();
  await engine.skip(submit);
  expect(submit).toHaveBeenCalledWith({ name: 'Ada' }, ['two']);
});

it('does not report a visited empty step as skipped', async () => {
  const engine = new FormEngine(definition, { name: 'Ada' });
  await engine.next();
  const submit = vi.fn();
  await engine.submit(submit);
  expect(submit).toHaveBeenCalledWith(expect.any(Object), []);
});

it('validates fields that the defaults of a skipped step show', async () => {
  const definition: FormDefinition = {
    id: 'skip-rules',
    title: 'Skip rules',
    submit: { label: 'Send' },
    steps: [
      { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A', defaultValue: 'show' }] },
      {
        id: 's2',
        title: 'Two',
        fields: [{ key: 'n', type: 'number', label: 'N', show: [{ field: 'a', eq: 'show' }], validation: { min: 10 } }],
      },
    ],
  };
  const engine = new FormEngine(definition);
  await engine.skip();
  engine.setValue('n', 1);
  const handler = vi.fn();
  expect(await engine.submit(handler)).toBe(false);
  expect(handler).not.toHaveBeenCalled();
  expect(engine.errors).toEqual({ n: 'Must be at least 10' });
});
