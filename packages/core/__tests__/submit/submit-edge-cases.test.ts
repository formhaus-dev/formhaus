import { expect, it, vi } from 'vitest';
import { FormEngine } from '../../src';
import { deferred, flatApi, valid } from './flat-api.fixtures';

const atLastStep = (options = {}) => {
  const engine = new FormEngine(flatApi, valid, options);
  engine.goToStepWithField('postcode');
  return engine;
};

it('accepts loose server payloads without throwing', async () => {
  const engine = atLastStep();
  const result = { ok: false, errors: { postcode: ['Unknown', 'postcode'], street: 42 }, formErrors: null } as never;
  expect(await engine.submit(() => result)).toBe(false);
  expect(engine.errors).toEqual({ postcode: 'Unknown postcode' });
  expect(engine.topLevelErrors).toEqual([]);
  await engine.submit(() => ({ ok: false, formErrors: 'Try again' }) as never);
  expect(engine.topLevelErrors).toEqual([]);
  await engine.submit(() => ({ ok: false, errors: 'Bad' }) as never);
  expect(engine.errors).toEqual({});
});

it('keeps errors set during a request that then returns nothing', async () => {
  const onAfterSubmit = vi.fn();
  const engine = atLastStep({ onAfterSubmit });
  expect(
    await engine.submit(async () => {
      engine.setErrors({ email: 'Taken' });
    }),
  ).toBe(true);
  expect(engine.errors).toEqual({ email: 'Taken' });
  expect(onAfterSubmit).toHaveBeenCalledTimes(1);
});

it('restores a skipped step when its rejection arrives after cancelPendingActions()', async () => {
  const definition = {
    ...flatApi,
    steps: flatApi.steps!.map((step) => (step.id === 'address' ? { ...step, skip: { label: 'Later' } } : step)),
  };
  const engine = new FormEngine(definition, valid);
  engine.setErrors({ postcode: 'Old' });
  const pending = engine.skip(async () => {
    await null;
    engine.cancelPendingActions();
    return { ok: false, errors: { email: 'Taken' } };
  });
  expect(await pending).toBe(false);
  expect(engine.isStepSkipped('address')).toBe(false);
  expect(engine.values.postcode).toBe('10115');
  expect(engine.errors).toEqual({ postcode: 'Old' });
});

it.each([
  ['rejection', { ok: false, errors: { name: 'Fresh' } }, { name: 'Fresh' }],
  ['success', { ok: true }, {}],
] as const)('keeps a newer %s when a cancelled skip settles late', async (_, fresh, errors) => {
  const engine = new FormEngine(
    {
      id: 'stale-skip',
      title: 'Stale skip',
      submit: { label: 'Send' },
      steps: [
        { id: 'profile', title: 'Profile', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
        { id: 'details', title: 'Details', skip: { label: 'Skip' }, fields: [{ key: 'bio', type: 'text', label: 'Bio' }] },
      ],
    },
    { name: 'Ada', bio: 'Draft' },
  );
  engine.setErrors({ bio: 'Old' });
  const response = deferred<{ ok: false; errors: Record<string, string> }>();
  const pending = engine.skip(() => response.promise);
  engine.cancelPendingActions();
  expect(await engine.submit(() => fresh)).toBe(fresh.ok);
  const values = { ...engine.values };
  response.resolve({ ok: false, errors: { name: 'Stale' } });
  expect(await pending).toBe(false);
  expect(engine.values).toEqual(values);
  expect(engine.errors).toEqual(errors);
  engine.validate();
  expect(engine.errors).toEqual(errors);
});

it('keeps an answer typed into a cleared field when a cancelled skip is rejected late', async () => {
  const engine = new FormEngine(
    {
      id: 'late-skip',
      title: 'Late skip',
      submit: { label: 'Send' },
      steps: [
        {
          id: 'note',
          title: 'Note',
          skip: { label: 'Skip' },
          fields: [
            { key: 'note', type: 'text', label: 'Note' },
            { key: 'more', type: 'text', label: 'More', show: [{ field: 'note', eq: 'more' }] },
          ],
        },
      ],
    },
    { note: 'hello' },
  );
  const response = deferred<{ ok: false }>();
  const pending = engine.skip(() => response.promise);
  engine.cancelPendingActions();
  engine.setValue('note', 'more');
  engine.setErrors({ more: 'Required' });
  response.resolve({ ok: false });
  expect(await pending).toBe(false);
  expect(engine.values.note).toBe('more');
  expect(engine.errors).toEqual({ more: 'Required' });
});

it.each([
  ['cancelled', true],
  ['current', false],
] as const)('restores a %s skip whose rejection arrives after an answer on another step changed', async (_, cancel) => {
  const engine = new FormEngine(
    {
      id: 'other-step',
      title: 'Other step',
      submit: { label: 'Send' },
      steps: [
        { id: 'profile', title: 'Profile', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
        { id: 'details', title: 'Details', skip: { label: 'Skip' }, fields: [{ key: 'bio', type: 'text', label: 'Bio' }] },
      ],
    },
    { name: 'Ada', bio: 'Draft' },
  );
  engine.goToStepWithField('bio');
  engine.setErrors({ bio: 'Old' });
  const response = deferred<{ ok: false }>();
  const pending = engine.skip(() => response.promise);
  if (cancel) engine.cancelPendingActions();
  engine.setValue('name', 'Grace');
  response.resolve({ ok: false });
  expect(await pending).toBe(false);
  expect(engine.isStepSkipped('details')).toBe(false);
  expect(engine.values).toEqual({ name: 'Grace', bio: 'Draft' });
  expect(engine.getSubmitValues()).toEqual({ name: 'Grace', bio: 'Draft' });
  expect(engine.errors).toEqual(cancel ? { bio: 'Old' } : {});
});

it('restores the other answers of a skipped step edited before its late rejection', async () => {
  const engine = new FormEngine(
    {
      id: 'same-step',
      title: 'Same step',
      submit: { label: 'Send' },
      steps: [
        { id: 'profile', title: 'Profile', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
        {
          id: 'details',
          title: 'Details',
          skip: { label: 'Skip' },
          fields: [
            { key: 'bio', type: 'text', label: 'Bio' },
            { key: 'site', type: 'text', label: 'Site' },
          ],
        },
      ],
    },
    { name: 'Ada', bio: 'Draft', site: 'ada.dev' },
  );
  engine.goToStepWithField('bio');
  const response = deferred<{ ok: false }>();
  const pending = engine.skip(() => response.promise);
  engine.cancelPendingActions();
  engine.setValue('bio', 'New');
  response.resolve({ ok: false });
  expect(await pending).toBe(false);
  expect(engine.isStepSkipped('details')).toBe(false);
  expect(engine.values).toEqual({ name: 'Ada', bio: 'New', site: 'ada.dev' });
});
