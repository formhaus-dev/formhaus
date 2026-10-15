import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { checkDefinition } from '../../src';
import { onExtras, routedSkipDefinition } from './form-engine-skip.fixtures';

describe('FormEngine step skip', () => {
  it('advances without validating and without running onStepValidate', async () => {
    const onStepValidate = vi.fn(async (stepId: string) => (stepId === 'extras' ? { phone: 'Taken' } : null));
    const engine = await onExtras({ onStepValidate });
    onStepValidate.mockClear();
    expect(await engine.skip()).toBe(true);
    expect(engine.currentStep?.id).toBe('notes');
    expect(engine.errors).toEqual({});
    expect(onStepValidate).not.toHaveBeenCalled();
    expect(engine.isStepSkipped('extras')).toBe(true);
  });

  it('resets the step to defaults, clears its errors and hides dependents', async () => {
    const engine = await onExtras();
    engine.setValue('plan', 'pro');
    engine.setValue('promo', 'SAVE');
    await engine.next();
    expect(engine.errors.phone).toBeDefined();
    expect(await engine.skip()).toBe(true);
    expect(engine.values).toEqual({ name: 'Ada', plan: 'free' });
    expect(engine.errors).toEqual({});
  });

  it('excludes skipped steps from submit validation and values', async () => {
    const engine = await onExtras();
    await engine.skip();
    engine.setValue('notes', 'Hi');
    const submit = vi.fn();
    expect(await engine.submit(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith({ name: 'Ada', notes: 'Hi' }, expect.any(Array));
  });

  it('un-skips a step when Next is pressed on it again', async () => {
    const engine = await onExtras();
    await engine.skip();
    await engine.back();
    expect(await engine.next()).toBe(false);
    expect(engine.isStepSkipped('extras')).toBe(false);
    expect(engine.errors.phone).toBeDefined();
    engine.setValue('phone', '555');
    expect(await engine.next()).toBe(true);
    expect(engine.getSubmitValues()).toEqual({ name: 'Ada', phone: '555', plan: 'free' });
  });

  it('submits without the last step when it is skipped', async () => {
    const engine = await onExtras();
    engine.setValue('phone', '555');
    await engine.next();
    engine.setValue('notes', 'draft');
    const submit = vi.fn();
    expect(await engine.skip(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith({ name: 'Ada', phone: '555', plan: 'free' }, expect.any(Array));
    expect(engine.isStepSkipped('notes')).toBe(true);
  });

  it('un-skips the last step when Submit is pressed on it', async () => {
    const engine = await onExtras();
    engine.setValue('phone', '555');
    await engine.next();
    expect(await engine.skip()).toBe(false);
    await engine.skip(vi.fn().mockRejectedValue(new Error('offline'))).catch(() => undefined);
    engine.setValue('notes', 'Hi');
    const submit = vi.fn();
    expect(await engine.submit(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ notes: 'Hi' }), expect.any(Array));
  });

  it('follows routes recomputed from the reset values', async () => {
    const engine = new FormEngine(routedSkipDefinition(), { kind: 'business' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'business']);
    expect(await engine.skip()).toBe(true);
    expect(engine.currentStep?.id).toBe('personal');
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal']);
  });

  it('passes the skip reason to onBeforeStepChange', async () => {
    const onBeforeStepChange = vi.fn();
    const engine = await onExtras({ onBeforeStepChange });
    await engine.skip();
    expect(onBeforeStepChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fromStepId: 'extras',
        toStepId: 'notes',
        reason: 'skip',
      }),
    );
  });

  it('drops a stale skip when inputs change during the guard', async () => {
    let release!: () => void;
    const onBeforeStepChange = vi.fn(({ reason }) =>
      reason === 'skip'
        ? new Promise<void>((resolve) => {
            release = resolve;
          })
        : undefined,
    );
    const engine = await onExtras({ onBeforeStepChange });
    const pending = engine.skip();
    expect(engine.stepValidating).toBe(true);
    engine.setValue('name', 'Grace');
    release();
    expect(await pending).toBe(false);
    expect(engine.currentStep?.id).toBe('extras');
  });

  it('forgets skipped steps on reset', async () => {
    const engine = await onExtras();
    await engine.skip();
    engine.reset();
    expect(engine.isStepSkipped('extras')).toBe(false);
  });

  it('warns about skip on a single-step form and with next: false', () => {
    const step = { title: 'Step', skip: { label: 'Skip' }, fields: [] };
    const paths = (definition: unknown) => checkDefinition(definition).map(({ code, path }) => `${code} ${path}`);
    expect(paths({ id: 'one', title: 'One', submit: { label: 'Submit' }, steps: [{ ...step, id: 'only' }] })).toEqual([
      'skip-unreachable /steps/0/skip',
    ]);
    expect(
      paths({
        id: 'two',
        title: 'Two',
        submit: { label: 'Submit' },
        steps: [
          { ...step, id: 'a', next: false },
          { ...step, id: 'b' },
        ],
      }),
    ).toEqual(['skip-unreachable /steps/0/skip']);
  });
});
