import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateDefinition } from '../../src';
import { onExtras, routedSkipDefinition } from './form-engine-skip.fixtures';

describe('FormEngine step skip', () => {
  it('advances without validating and without running onStepValidate', async () => {
    const onStepValidate = vi.fn(async (stepId: string) => (stepId === 'extras' ? { phone: 'Taken' } : null));
    const engine = await onExtras({ onStepValidate });
    onStepValidate.mockClear();
    expect(await engine.skipStepAsync()).toBe(true);
    expect(engine.currentStep?.id).toBe('notes');
    expect(engine.errors).toEqual({});
    expect(onStepValidate).not.toHaveBeenCalled();
    expect(engine.isStepSkipped('extras')).toBe(true);
  });

  it('resets the step to defaults, clears its errors and hides dependents', async () => {
    const engine = await onExtras();
    engine.setValue('plan', 'pro');
    engine.setValue('promo', 'SAVE');
    await engine.nextStepAsync();
    expect(engine.errors.phone).toBeDefined();
    expect(engine.skipStep()).toBe(true);
    expect(engine.values).toEqual({ name: 'Ada', plan: 'free' });
    expect(engine.errors).toEqual({});
  });

  it('excludes skipped steps from submit validation and values', async () => {
    const engine = await onExtras();
    await engine.skipStepAsync();
    engine.setValue('notes', 'Hi');
    const submit = vi.fn();
    expect(await engine.submitAsync(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith({ name: 'Ada', notes: 'Hi' });
  });

  it('un-skips a step when Next is pressed on it again', async () => {
    const engine = await onExtras();
    await engine.skipStepAsync();
    await engine.prevStepAsync();
    expect(await engine.nextStepAsync()).toBe(false);
    expect(engine.isStepSkipped('extras')).toBe(false);
    expect(engine.errors.phone).toBeDefined();
    engine.setValue('phone', '555');
    expect(await engine.nextStepAsync()).toBe(true);
    expect(engine.getSubmitValues()).toEqual({ name: 'Ada', phone: '555', plan: 'free' });
  });

  it('submits without the last step when it is skipped', async () => {
    const engine = await onExtras();
    engine.setValue('phone', '555');
    await engine.nextStepAsync();
    engine.setValue('notes', 'draft');
    const submit = vi.fn();
    expect(await engine.skipStepAsync(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith({ name: 'Ada', phone: '555', plan: 'free' });
    expect(engine.isStepSkipped('notes')).toBe(true);
  });

  it('un-skips the last step when Submit is pressed on it', async () => {
    const engine = await onExtras();
    engine.setValue('phone', '555');
    await engine.nextStepAsync();
    expect(engine.skipStep()).toBe(false);
    await engine.skipStepAsync(vi.fn().mockRejectedValue(new Error('offline'))).catch(() => undefined);
    engine.setValue('notes', 'Hi');
    const submit = vi.fn();
    expect(await engine.submitAsync(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ notes: 'Hi' }));
  });

  it('follows routes recomputed from the reset values', async () => {
    const engine = new FormEngine(routedSkipDefinition(), { kind: 'business' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'business']);
    expect(await engine.skipStepAsync()).toBe(true);
    expect(engine.currentStep?.id).toBe('personal');
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal']);
  });

  it('passes the skip reason to onBeforeStepChange', async () => {
    const onBeforeStepChange = vi.fn();
    const engine = await onExtras({ onBeforeStepChange });
    await engine.skipStepAsync();
    expect(onBeforeStepChange).toHaveBeenLastCalledWith(expect.objectContaining({
      fromStepId: 'extras', toStepId: 'notes', direction: 'next', reason: 'skip',
    }));
  });

  it('drops a stale skip when inputs change during the guard', async () => {
    let release!: () => void;
    const onBeforeStepChange = vi.fn(({ reason }) => reason === 'skip' ? new Promise<void>((resolve) => { release = resolve; }) : undefined);
    const engine = await onExtras({ onBeforeStepChange });
    const pending = engine.skipStepAsync();
    expect(engine.stepValidating).toBe(true);
    engine.setValue('name', 'Grace');
    release();
    expect(await pending).toBe(false);
    expect(engine.currentStep?.id).toBe('extras');
  });

  it('forgets skipped steps on reset', async () => {
    const engine = await onExtras();
    await engine.skipStepAsync();
    engine.reset();
    expect(engine.isStepSkipped('extras')).toBe(false);
  });

  it('warns about skip on a single-step form and with next: false', () => {
    const warning = 'has "skip" but no Next button or later step.';
    const step = { title: 'Step', skip: { label: 'Skip' }, fields: [] };
    expect(validateDefinition({ id: 'one', title: 'One', submit: { label: 'Submit' }, steps: [{ ...step, id: 'only' }] }))
      .toContain(`Step "only" ${warning}`);
    expect(validateDefinition({
      id: 'two', title: 'Two', submit: { label: 'Submit' }, steps: [{ ...step, id: 'a', next: false }, { ...step, id: 'b' }],
    })).toEqual([`Step "a" ${warning}`]);
  });
});
