import { describe, expect, it, vi } from 'vitest';
import { FormEngine, type ValidateFn } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { deferred } from '../renderers/fixtures';
import { league, leagueValues } from './validate.fixtures';

type Result = Awaited<ReturnType<ValidateFn>>;

const emails: FormDefinition = {
  id: 'emails',
  title: 'Emails',
  submit: { label: 'Send' },
  fields: [
    { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
    { key: 'confirm', type: 'email', label: 'Confirm' },
  ],
};

const mismatch: ValidateFn = () => ({ email: 'Use a work email', confirm: 'Emails must match', '': 'Check the form' });

describe('FormEngine validateWithRules on submit', () => {
  it('runs onValidate when the definition rules fail and merges both errors', async () => {
    const send = vi.fn();
    const onFormEvent = vi.fn();
    const onValidate = vi.fn(mismatch);
    const engine = new FormEngine(emails, { confirm: 'b@example.com' }, { onValidate, onFormEvent, validateWithRules: true });
    expect(await engine.submit(send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(onValidate).toHaveBeenCalledWith(expect.objectContaining({ confirm: 'b@example.com' }), {
      stepId: undefined,
      fields: ['email', 'confirm'],
      submit: true,
    });
    expect(engine.errors).toEqual({ email: expect.not.stringMatching('Use a work email'), confirm: 'Emails must match' });
    expect(engine.topLevelErrors).toEqual(['Check the form']);
    expect(onFormEvent.mock.calls.filter(([event]) => event.type === 'form_submit_failed')).toEqual([
      [{ type: 'form_submit_failed', reason: 'validation' }],
    ]);
    expect(engine.submitting).toBe(false);
  });

  it('keeps the definition errors when onValidate passes', async () => {
    const onFormEvent = vi.fn();
    const engine = new FormEngine(emails, {}, { onValidate: () => null, onFormEvent, validateWithRules: true });
    expect(await engine.submit(() => {})).toBe(false);
    expect(Object.keys(engine.errors)).toEqual(['email']);
    expect(onFormEvent).toHaveBeenCalledWith({ type: 'form_submit_failed', reason: 'validation' });
  });

  it('does not run onBeforeSubmit or the handler', async () => {
    const onBeforeSubmit = vi.fn();
    const send = vi.fn();
    const engine = new FormEngine(emails, {}, { onValidate: mismatch, onBeforeSubmit, validateWithRules: true });
    expect(await engine.submit(send)).toBe(false);
    expect(onBeforeSubmit).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('submits when both pass', async () => {
    const send = vi.fn();
    const engine = new FormEngine(emails, { email: 'a@example.com' }, { onValidate: () => null, validateWithRules: true });
    expect(await engine.submit(send)).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('opens the first step with an error of either source', async () => {
    const engine = new FormEngine(league, leagueValues, {
      onValidate: (_, { submit }) => (submit ? { 'players.0.name': 'Duplicate' } : null),
      validateWithRules: true,
    });
    await engine.next();
    await engine.next();
    engine.setValue('email', '');
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.currentStep?.id).toBe('account');
    expect(engine.errors).toEqual({ email: expect.any(String), 'players.0.name': 'Duplicate' });
  });

  it('ignores a result when a checked value changes while it runs', async () => {
    const check = deferred<Result>();
    const onFormEvent = vi.fn();
    const engine = new FormEngine(emails, {}, { onValidate: () => check.promise, onFormEvent, validateWithRules: true });
    const submitting = engine.submit(() => {});
    expect(engine.submitting).toBe(true);
    engine.setValue('confirm', 'c@example.com');
    check.resolve({ confirm: 'Emails must match' });
    expect(await submitting).toBe(false);
    expect(engine.errors.confirm).toBeUndefined();
    expect(onFormEvent).not.toHaveBeenCalledWith({ type: 'form_submit_failed', reason: 'validation' });
  });
});

describe('FormEngine validateWithRules on step change', () => {
  it('runs onValidate when the step rules fail and merges both errors', async () => {
    const onValidate = vi.fn<ValidateFn>(() => ({ email: 'Taken', plan: 'Pick a paid plan', '': 'Service down' }));
    const engine = new FormEngine(league, { plan: 'solo' }, { onValidate, validateWithRules: true });
    expect(await engine.next()).toBe(false);
    expect(onValidate).toHaveBeenCalledWith(expect.objectContaining({ plan: 'solo' }), {
      stepId: 'account',
      fields: ['email', 'plan'],
      submit: false,
    });
    expect(engine.errors).toEqual({ email: expect.not.stringMatching('Taken'), plan: 'Pick a paid plan' });
    expect(engine.topLevelErrors).toEqual(['Service down']);
    expect(engine.currentStep?.id).toBe('account');
    expect(engine.stepValidating).toBe(false);
  });

  it('skips onStepValidate and onBeforeStepChange when the step rules fail', async () => {
    const onStepValidate = vi.fn(async () => null);
    const onBeforeStepChange = vi.fn();
    const engine = new FormEngine(league, {}, { onValidate: () => null, onStepValidate, onBeforeStepChange, validateWithRules: true });
    expect(await engine.next()).toBe(false);
    expect(engine.errors.email).toBeDefined();
    expect(onStepValidate).not.toHaveBeenCalled();
    expect(onBeforeStepChange).not.toHaveBeenCalled();
  });

  it('moves on when both pass', async () => {
    const engine = new FormEngine(league, leagueValues, { onValidate: () => null, validateWithRules: true });
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('roster');
  });

  it('ignores a result when a checked value changes while it runs', async () => {
    const check = deferred<Result>();
    const engine = new FormEngine(league, {}, { onValidate: () => check.promise, validateWithRules: true });
    const moving = engine.next();
    expect(engine.stepValidating).toBe(true);
    engine.setValue('plan', 'pro');
    check.resolve({ plan: 'Pick a paid plan' });
    expect(await moving).toBe(false);
    expect(engine.errors.plan).toBeUndefined();
  });

  it('has no effect without onValidate', async () => {
    const engine = new FormEngine(league, {}, { validateWithRules: true });
    expect(await engine.next()).toBe(false);
    expect(engine.stepValidating).toBe(false);
    expect(Object.keys(engine.errors)).toEqual(['email']);
  });
});
