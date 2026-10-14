import { expect, it, vi } from 'vitest';
import { FormEngine } from '../../src';
import { flatApi, valid } from './flat-api.fixtures';

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
  expect(await engine.submit(async () => { engine.setErrors({ email: 'Taken' }); })).toBe(true);
  expect(engine.errors).toEqual({ email: 'Taken' });
  expect(onAfterSubmit).toHaveBeenCalledTimes(1);
});

it('restores a skipped step when its rejection arrives after cancelPendingActions()', async () => {
  const definition = { ...flatApi, steps: flatApi.steps!.map((step) => step.id === 'address' ? { ...step, skip: { label: 'Later' } } : step) };
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
