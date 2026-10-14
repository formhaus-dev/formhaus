import { describe, expect, it } from 'vitest';
import { FormEngine, type FormDefinition } from '../../src';
import { flatApi, valid } from './flat-api.fixtures';

async function rejected(errors: Record<string, string>, values: Record<string, unknown> = valid, options = {}) {
  const engine = new FormEngine(flatApi, values, options);
  engine.goToStepWithField('postcode');
  await engine.submit(() => ({ ok: false, errors }));
  return engine;
}

describe('server error clearing', () => {
  it('clears only the edited field', async () => {
    const engine = await rejected({ firstName: 'Bad', email: 'Taken', postcode: 'Unknown' });
    engine.setValue('firstName', 'Ada Augusta');
    expect(engine.errors).toEqual({ email: 'Taken', postcode: 'Unknown' });
  });

  it('keeps the error when the same value is written again', async () => {
    const engine = await rejected({ email: 'Taken' });
    engine.setValue('email', valid.email);
    expect(engine.errors).toEqual({ email: 'Taken' });
  });

  it('keeps server errors while moving back and forward', async () => {
    const engine = await rejected({ firstName: 'Bad', postcode: 'Unknown' });
    expect(await engine.next()).toBe(true);
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('address');
    expect(await engine.back()).toBe(true);
    expect(engine.errors).toEqual({ firstName: 'Bad', postcode: 'Unknown' });
  });

  it('keeps server errors through client validation of other fields', async () => {
    const engine = await rejected({ postcode: 'Unknown' });
    engine.goToStepWithField('lastName');
    engine.setValue('lastName', '');
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({ lastName: 'This field is required', postcode: 'Unknown' });
    expect(engine.validate()).toEqual({ lastName: 'This field is required' });
    expect(engine.errors).toEqual({ lastName: 'This field is required', postcode: 'Unknown' });
  });

  it('shows the client error over a server error on the same field and falls back to it', async () => {
    const engine = await rejected({ postcode: 'Unknown' });
    engine.goToStepWithField('postcode');
    engine.setValue('street', '');
    engine.setValue('street', '1 Main St');
    expect(engine.errors.postcode).toBe('Unknown');
    expect(engine.validateField('postcode')).toBeNull();
    expect(engine.errors.postcode).toBeUndefined();
  });

  it('keeps server errors and form errors when onStepValidate reports errors', async () => {
    const engine = new FormEngine(flatApi, valid, {
      onStepValidate: async () => ({ email: 'Unreachable', other: 'Check failed' }),
    });
    engine.goToStepWithField('postcode');
    await engine.submit(() => ({ ok: false, errors: { email: 'Taken', postcode: 'Unknown' }, formErrors: ['Rate limited'] }));
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({ email: 'Unreachable', postcode: 'Unknown' });
    expect(engine.topLevelErrors).toEqual(['Rate limited', 'Check failed']);
  });

  it('drops the error of a field that a later answer hides', async () => {
    const engine = await rejected({ companyName: 'Not registered', postcode: 'Unknown' }, { ...valid, accountType: 'business', companyName: 'Engines' });
    expect(engine.currentStep?.id).toBe('account');
    engine.setValue('accountType', 'personal');
    expect(engine.errors).toEqual({ postcode: 'Unknown' });
    engine.setValue('accountType', 'business');
    expect(engine.errors).toEqual({ postcode: 'Unknown' });
  });

  it('clears everything on reset()', async () => {
    const engine = await rejected({ firstName: 'Bad', other: 'Locked' });
    engine.reset();
    expect(engine.errors).toEqual({});
    expect(engine.topLevelErrors).toEqual([]);
  });
});

describe('server errors and routes', () => {
  const routed: FormDefinition = {
    id: 'routed', title: '', submit: { label: 'Send' },
    steps: [
      { id: 'start', title: 'Start', fields: [{ key: 'plan', type: 'radio', label: 'Plan', options: [{ value: 'free', label: 'Free' }, { value: 'paid', label: 'Paid' }] }],
        routes: [{ show: [{ field: 'plan', eq: 'free' }], to: 'done' }] },
      { id: 'billing', title: 'Billing', fields: [{ key: 'card', type: 'text', label: 'Card' }] },
      { id: 'done', title: 'Done', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
    ],
  };

  it('drops errors of a step that leaves the route and shows errors for off-route keys as form errors', async () => {
    const engine = new FormEngine(routed, { plan: 'paid', card: '4242' });
    engine.goToStepWithField('note');
    await engine.submit(() => ({ ok: false, errors: { note: 'Too short', card: 'Declined' } }));
    expect(engine.currentStep?.id).toBe('billing');
    engine.goToStepWithField('plan');
    engine.setValue('plan', 'free');
    expect(engine.errors).toEqual({ note: 'Too short' });
    expect(engine.stepErrors).toEqual({ done: ['note'] });
    engine.setErrors({ card: 'Declined' });
    expect(engine.errors).toEqual({});
    expect(engine.topLevelErrors).toEqual(['Declined']);
  });
});
