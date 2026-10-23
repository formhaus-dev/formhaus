import { describe, expect, it, vi } from 'vitest';
import { FormEngine, type ValidateFn } from '../../src/engine';
import { deferred } from '../renderers/fixtures';
import { league, leagueValues } from './validate.fixtures';

type Result = Awaited<ReturnType<ValidateFn>>;

function once(result: Result, when: (submit: boolean) => boolean = () => true): ValidateFn {
  let used = false;
  return (_, { submit }) => {
    if (used || !when(submit)) return null;
    used = true;
    return result;
  };
}

async function onNotes(onValidate: ValidateFn) {
  const engine = new FormEngine(league, leagueValues, { onValidate });
  await engine.next();
  await engine.next();
  return engine;
}

describe('FormEngine onValidate form errors', () => {
  it('clears them on the next Continue', async () => {
    const engine = new FormEngine(league, leagueValues, { onValidate: once({ '': 'Service down' }) });
    expect(await engine.next()).toBe(false);
    expect(engine.topLevelErrors).toEqual(['Service down']);
    expect(await engine.next()).toBe(true);
    expect(engine.topLevelErrors).toEqual([]);
  });

  it('clears them on Back', async () => {
    const engine = new FormEngine(league, leagueValues, {
      onValidate: (_, { stepId }) => (stepId === 'roster' ? { '': 'Roster closed' } : null),
    });
    await engine.next();
    expect(await engine.next()).toBe(false);
    expect(engine.topLevelErrors).toEqual(['Roster closed']);
    expect(await engine.back()).toBe(true);
    expect(engine.topLevelErrors).toEqual([]);
  });

  it('clears them on a Submit that fails the definition rules', async () => {
    const engine = await onNotes(once({ '': 'Service down' }, (submit) => submit));
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.topLevelErrors).toEqual(['Service down']);
    engine.setValue('email', '');
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.errors.email).toBeDefined();
    expect(engine.topLevelErrors).toEqual([]);
  });

  it('keeps form errors of the submit handler and of setErrors', async () => {
    let down = false;
    const engine = await onNotes((_, { submit }) => (submit && down ? { '': 'Service down' } : null));
    await engine.submit(() => ({ ok: false, formErrors: ['Server says no'] }));
    expect(engine.topLevelErrors).toEqual(['Server says no']);
    down = true;
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.topLevelErrors).toEqual(['Server says no', 'Service down']);
    down = false;
    engine.setErrors({ '': 'External' });
    engine.setValue('email', '');
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.topLevelErrors).toEqual(['External']);
  });
});

describe('FormEngine onValidate failures and pending calls', () => {
  it('rejects Continue when it throws', async () => {
    const engine = new FormEngine(league, leagueValues, {
      onValidate: () => {
        throw new Error('offline');
      },
    });
    await expect(engine.next()).rejects.toThrow('offline');
    expect(engine.stepValidating).toBe(false);
    expect(engine.currentStep?.id).toBe('account');
  });

  it('rejects Submit when it rejects, without sending', async () => {
    const send = vi.fn();
    const engine = await onNotes(async (_, { submit }) => {
      if (submit) throw new Error('offline');
      return null;
    });
    await expect(engine.submit(send)).rejects.toThrow('offline');
    expect(send).not.toHaveBeenCalled();
    expect(engine.submitting).toBe(false);
  });

  it('ignores a result after reset', async () => {
    const check = deferred<Result>();
    const engine = new FormEngine(league, leagueValues, { onValidate: () => check.promise });
    const moving = engine.next();
    engine.reset(leagueValues);
    check.resolve({ email: 'Taken', '': 'Service down' });
    expect(await moving).toBe(false);
    expect(engine.errors).toEqual({});
    expect(engine.topLevelErrors).toEqual([]);
    expect(engine.stepValidating).toBe(false);
  });

  it('ignores a submit result after replaceDefinition', async () => {
    const check = deferred<Result>();
    const send = vi.fn();
    const engine = await onNotes((_, { submit }) => (submit ? check.promise : null));
    const submitting = engine.submit(send);
    engine.replaceDefinition({ ...league, title: 'League 2' });
    check.resolve({ notes: 'Too short' });
    expect(await submitting).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(engine.errors).toEqual({});
    expect(engine.submitting).toBe(false);
  });
});
