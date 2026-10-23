import { describe, expect, it, vi } from 'vitest';
import { FormEngine, type ValidateFn } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { deferred } from '../renderers/fixtures';
import { league, leagueValues } from './validate.fixtures';

type Result = Awaited<ReturnType<ValidateFn>>;

async function onNotes(options: ConstructorParameters<typeof FormEngine>[2]) {
  const engine = new FormEngine(league, leagueValues, options);
  await engine.next();
  await engine.next();
  return engine;
}

describe('FormEngine onValidate on step change', () => {
  it('gets the values and the visible field paths of the step, with group items', async () => {
    const onValidate = vi.fn<ValidateFn>(() => null);
    const engine = new FormEngine(league, { ...leagueValues, plan: 'team', company: 'Acme' }, { onValidate });
    expect(await engine.next()).toBe(true);
    expect(await engine.next()).toBe(true);
    expect(onValidate.mock.calls[0]).toEqual([
      expect.objectContaining({ email: 'ada@example.com', company: 'Acme' }),
      { stepId: 'account', fields: ['email', 'plan', 'company'], submit: false },
    ]);
    expect(onValidate.mock.calls[1][1]).toEqual({
      stepId: 'roster',
      fields: ['players', 'players.0.name', 'players.0.role', 'players.1.name'],
      submit: false,
    });
  });

  it('runs only after the built-in rules pass', async () => {
    const onValidate = vi.fn<ValidateFn>(() => null);
    const engine = new FormEngine(league, {}, { onValidate });
    expect(await engine.next()).toBe(false);
    expect(engine.errors.email).toBeDefined();
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('runs after onStepValidate and before onBeforeStepChange', async () => {
    const calls: string[] = [];
    const engine = new FormEngine(league, leagueValues, {
      onStepValidate: async () => {
        calls.push('onStepValidate');
        return null;
      },
      onValidate: () => {
        calls.push('onValidate');
      },
      onBeforeStepChange: () => {
        calls.push('onBeforeStepChange');
      },
    });
    expect(await engine.next()).toBe(true);
    expect(calls).toEqual(['onStepValidate', 'onValidate', 'onBeforeStepChange']);
  });

  it('does not run when onStepValidate reports errors', async () => {
    const onValidate = vi.fn<ValidateFn>(() => null);
    const engine = new FormEngine(league, leagueValues, { onStepValidate: async () => ({ email: 'Taken' }), onValidate });
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({ email: 'Taken' });
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('keeps the step and shows field errors', async () => {
    const engine = new FormEngine(league, leagueValues, { onValidate: async () => ({ email: 'Taken' }) });
    expect(await engine.next()).toBe(false);
    expect(engine.currentStep?.id).toBe('account');
    expect(engine.errors).toEqual({ email: 'Taken' });
    expect(engine.stepValidating).toBe(false);
  });

  it('shows errors on group item paths', async () => {
    const engine = new FormEngine(league, leagueValues, {
      onValidate: (_, { stepId }) => (stepId === 'roster' ? { 'players.1.name': 'Name the player' } : null),
    });
    await engine.next();
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({ 'players.1.name': 'Name the player' });
  });

  it('turns empty, unknown, hidden and other-step keys into top-level errors', async () => {
    const engine = new FormEngine(league, leagueValues, {
      onValidate: () => ({ '': 'Service down', ghost: 'Ghost', company: 'Hidden', notes: 'Later', 'players.0.name': 'Item' }),
    });
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({});
    expect(engine.topLevelErrors).toEqual(['Service down', 'Ghost', 'Hidden', 'Later', 'Item']);
  });

  it('passes on null, undefined and an empty object', async () => {
    for (const result of [null, undefined, {}] as Result[]) {
      const engine = new FormEngine(league, leagueValues, { onValidate: () => result });
      expect(await engine.next()).toBe(true);
    }
  });

  it('ignores a result when a checked value changes while it runs', async () => {
    const check = deferred<Result>();
    const engine = new FormEngine(league, leagueValues, { onValidate: () => check.promise });
    const moving = engine.next();
    expect(engine.stepValidating).toBe(true);
    engine.setValue('plan', 'pro');
    check.resolve({ email: 'Taken' });
    expect(await moving).toBe(false);
    expect(engine.errors).toEqual({});
    expect(engine.currentStep?.id).toBe('account');
  });

  it('ignores a result when the step changes while it runs', async () => {
    const check = deferred<Result>();
    const engine = new FormEngine(league, leagueValues, {
      onValidate: (_, { stepId }) => (stepId === 'roster' ? check.promise : null),
    });
    await engine.next();
    const moving = engine.next();
    engine.goToStepWithField('email');
    check.resolve({ 'players.0.name': 'Taken' });
    expect(await moving).toBe(false);
    expect(engine.currentStep?.id).toBe('account');
    expect(engine.errors).toEqual({});
  });

  it('does not run on Back or Skip', async () => {
    const onValidate = vi.fn<ValidateFn>(() => null);
    const engine = new FormEngine(league, leagueValues, { onValidate });
    await engine.next();
    await engine.skip();
    await engine.back();
    expect(onValidate).toHaveBeenCalledTimes(1);
  });
});

describe('FormEngine onValidate on submit', () => {
  it('gets every visible field path and runs before onBeforeSubmit', async () => {
    const calls: string[] = [];
    const onValidate = vi.fn<ValidateFn>(() => {
      calls.push('onValidate');
    });
    const engine = await onNotes({ onValidate, onBeforeSubmit: () => void calls.push('onBeforeSubmit') });
    calls.length = 0;
    expect(await engine.submit(() => void calls.push('submit'))).toBe(true);
    expect(calls).toEqual(['onValidate', 'onBeforeSubmit', 'submit']);
    expect(onValidate.mock.lastCall).toEqual([
      expect.objectContaining({ notes: 'Hi' }),
      {
        stepId: 'notes',
        fields: ['email', 'plan', 'players', 'players.0.name', 'players.0.role', 'players.1.name', 'notes'],
        submit: true,
      },
    ]);
  });

  it('leaves skipped steps out', async () => {
    const onValidate = vi.fn<ValidateFn>(() => null);
    const engine = new FormEngine(league, leagueValues, { onValidate });
    await engine.next();
    await engine.skip();
    await engine.submit(() => {});
    expect(onValidate.mock.lastCall?.[1].fields).toEqual(['email', 'plan', 'notes']);
  });

  it('blocks the submit and opens the step of the first error', async () => {
    const send = vi.fn();
    const onBeforeSubmit = vi.fn();
    const onFormEvent = vi.fn();
    const engine = await onNotes({
      onValidate: (_, { submit }) => (submit ? { 'players.0.name': 'Duplicate', '': 'Check the roster' } : null),
      onBeforeSubmit,
      onFormEvent,
    });
    expect(await engine.submit(send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(onBeforeSubmit).not.toHaveBeenCalled();
    expect(engine.currentStep?.id).toBe('roster');
    expect(engine.errors).toEqual({ 'players.0.name': 'Duplicate' });
    expect(engine.topLevelErrors).toEqual(['Check the roster']);
    expect(engine.submitting).toBe(false);
    expect(onFormEvent).toHaveBeenCalledWith({ type: 'form_submit_failed', reason: 'validation' });
  });

  it('runs on a single-step form without a step id', async () => {
    const definition: FormDefinition = {
      id: 'single',
      title: 'Single',
      submit: { label: 'Send' },
      fields: [{ key: 'name', type: 'text', label: 'Name' }],
    };
    const onValidate = vi.fn<ValidateFn>(() => ({ name: 'Taken' }));
    const engine = new FormEngine(definition, { name: 'Ada' }, { onValidate });
    expect(await engine.submit(() => {})).toBe(false);
    expect(onValidate.mock.lastCall?.[1]).toEqual({ stepId: undefined, fields: ['name'], submit: true });
    expect(engine.errors).toEqual({ name: 'Taken' });
  });

  it('ignores a result when a checked value changes while it runs', async () => {
    const check = deferred<Result>();
    const send = vi.fn();
    const engine = await onNotes({ onValidate: (_, { submit }) => (submit ? check.promise : null) });
    const submitting = engine.submit(send);
    expect(engine.submitting).toBe(true);
    engine.setValue('notes', 'Changed');
    check.resolve({ notes: 'Too short' });
    expect(await submitting).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(engine.errors).toEqual({});
  });

  it('keeps server errors from an earlier submit next to its errors', async () => {
    let round = 0;
    const engine = await onNotes({ onValidate: (_, { submit }) => (submit && ++round === 2 ? { email: 'Taken' } : null) });
    await engine.submit(() => ({ ok: false, errors: { notes: 'Rejected' } }));
    expect(engine.errors).toEqual({ notes: 'Rejected' });
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.errors).toEqual({ notes: 'Rejected', email: 'Taken' });
    expect(engine.currentStep?.id).toBe('account');
  });
});
