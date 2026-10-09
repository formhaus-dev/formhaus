import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src';
import { onExtras } from './form-engine-skip.fixtures';

function endingDefinition(required = false, defaultValue = 'done'): FormDefinition {
  return {
    id: 'ending',
    title: 'Ending',
    submit: { label: 'Submit' },
    steps: [
      {
        id: 'kind',
        title: 'Kind',
        skip: { label: 'Skip' },
        fields: [{ key: 'kind', type: 'text', label: 'Kind', defaultValue }],
        routes: [{ to: null, show: [{ field: 'kind', eq: 'done' }] }],
      },
      { id: 'details', title: 'Details', fields: [{ key: 'details', type: 'text', label: 'Details', validation: { required } }] },
    ],
  };
}

async function filledExtras(options = {}) {
  const engine = await onExtras(options);
  engine.setValue('phone', '555');
  return engine;
}

describe('FormEngine skip guards', () => {
  it('keeps values and the step when onBeforeStepChange cancels a skip', async () => {
    const onBeforeStepChange = vi.fn(({ reason }: { reason: string }) => reason !== 'skip');
    const engine = await filledExtras({ onBeforeStepChange });
    expect(await engine.skipStepAsync()).toBe(false);
    expect(onBeforeStepChange).toHaveBeenLastCalledWith(expect.objectContaining({
      reason: 'skip', toStepId: 'notes', values: { name: 'Ada', phone: '555', plan: 'free' },
    }));
    expect(engine.values.phone).toBe('555');
    expect(engine.isStepSkipped('extras')).toBe(false);
    expect(engine.getSubmitValues().phone).toBe('555');
  });

  it('keeps values and the step when a skip goes stale', async () => {
    let release!: () => void;
    const onBeforeStepChange = ({ reason }: { reason: string }) => (reason === 'skip' ? new Promise<void>((resolve) => { release = resolve; }) : undefined);
    const engine = await filledExtras({ onBeforeStepChange });
    const pending = engine.skipStepAsync();
    engine.cancelPendingActions();
    release();
    expect(await pending).toBe(false);
    expect(engine.values.phone).toBe('555');
    expect(engine.isStepSkipped('extras')).toBe(false);
  });

  it('keeps the last step when onBeforeSubmit cancels a skip', async () => {
    const engine = await filledExtras({ onBeforeSubmit: () => false });
    await engine.nextStepAsync();
    engine.setValue('notes', 'draft');
    const submit = vi.fn();
    expect(await engine.skipStepAsync(submit)).toBe(false);
    expect(submit).not.toHaveBeenCalled();
    expect(engine.values.notes).toBe('draft');
    expect(engine.isStepSkipped('notes')).toBe(false);
  });

  it('includes a skipped step again when one of its fields changes', async () => {
    const engine = await filledExtras();
    await engine.skipStepAsync();
    await engine.prevStepAsync();
    engine.setValue('phone', '777');
    expect(engine.isStepSkipped('extras')).toBe(false);
    expect(engine.getSubmitValues().phone).toBe('777');
  });

  it('refuses a skip that would end the form without a submit handler', async () => {
    const engine = new FormEngine(endingDefinition(), { kind: 'more' });
    expect(engine.skipStep()).toBe(false);
    expect(await engine.skipStepAsync()).toBe(false);
    expect(engine.values.kind).toBe('more');
    expect(engine.isStepSkipped('kind')).toBe(false);
  });

  it('submits when the reset values end the form', async () => {
    const engine = new FormEngine(endingDefinition(), { kind: 'more' });
    const submit = vi.fn();
    expect(await engine.skipStepAsync(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith({});
    expect(engine.isStepSkipped('kind')).toBe(true);
    expect(engine.values.kind).toBe('done');
  });

  it('validates the path that the reset values choose', async () => {
    const engine = new FormEngine(endingDefinition(true), { kind: 'more' });
    const submit = vi.fn();
    expect(await engine.skipStepAsync(submit)).toBe(true);
    expect(engine.errors).toEqual({});
  });

  it('leaves answers of steps the skip removes out of the payload', async () => {
    const engine = new FormEngine(endingDefinition(), { kind: 'more', details: 'leftover' });
    const submit = vi.fn();
    expect(await engine.skipStepAsync(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith({});
  });

  it('restores values when a skip submit is cancelled', async () => {
    const engine = new FormEngine(endingDefinition(), { kind: 'more', details: 'kept' }, { onBeforeSubmit: () => false });
    expect(await engine.skipStepAsync(vi.fn())).toBe(false);
    expect(engine.values).toEqual({ kind: 'more', details: 'kept' });
    expect(engine.isStepSkipped('kind')).toBe(false);
  });

  it('restores values when a skip submit throws', async () => {
    const engine = new FormEngine(endingDefinition(), { kind: 'more' });
    await expect(engine.skipStepAsync(vi.fn().mockRejectedValue(new Error('offline')))).rejects.toThrow('offline');
    expect(engine.values.kind).toBe('more');
    expect(engine.isStepSkipped('kind')).toBe(false);
  });

  it('keeps a committed skip submit when onAfterSubmit throws', async () => {
    const engine = new FormEngine(endingDefinition(), { kind: 'more' }, { onAfterSubmit: () => { throw new Error('receipt'); } });
    const submit = vi.fn();
    await expect(engine.skipStepAsync(submit)).rejects.toMatchObject({ committed: true });
    expect(submit).toHaveBeenCalledWith({});
    expect(engine.values.kind).toBe('done');
    expect(engine.isStepSkipped('kind')).toBe(true);
  });

  it('does not restore over values edited during a skip submit', async () => {
    let release!: (allowed: boolean) => void;
    const onBeforeSubmit = () => new Promise<boolean>((resolve) => { release = resolve; });
    const engine = new FormEngine(endingDefinition(), { kind: 'more', details: 'old' }, { onBeforeSubmit });
    const pending = engine.skipStepAsync(vi.fn());
    engine.setValue('details', 'new');
    release(false);
    expect(await pending).toBe(false);
    expect(engine.values.details).toBe('new');
  });

  it('restores errors of the step when a skip submit is cancelled', async () => {
    const engine = new FormEngine(endingDefinition(), { kind: 'more' }, { onBeforeSubmit: () => false });
    engine.setErrors({ kind: 'Taken' });
    expect(await engine.skipStepAsync(vi.fn())).toBe(false);
    expect(engine.errors.kind).toBe('Taken');
  });

  it('skips forward from the last step when the reset values add a step', async () => {
    const sync = new FormEngine(endingDefinition(false, ''), { kind: 'done' });
    const async = new FormEngine(endingDefinition(false, ''), { kind: 'done' });
    expect(sync.isLastStep).toBe(true);
    expect(sync.skipStep()).toBe(true);
    expect(await async.skipStepAsync(vi.fn())).toBe(true);
    expect([sync.currentStep?.id, async.currentStep?.id]).toEqual(['details', 'details']);
  });

  it('keeps a step skipped when a field is set to its current value', async () => {
    const engine = await filledExtras();
    await engine.skipStepAsync();
    await engine.prevStepAsync();
    engine.setValue('plan', engine.values.plan);
    expect(engine.isStepSkipped('extras')).toBe(true);
  });
});
