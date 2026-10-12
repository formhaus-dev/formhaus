import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src';
import { autoAdvance } from '../../src/internal';
import { multiStepDefinition } from './form-engine-steps.fixtures';

describe('engine actions', () => {
  it('exposes state as read-only getters', () => {
    const engine = new FormEngine(multiStepDefinition);
    expect(() => { (engine as unknown as { currentStepIndex: number }).currentStepIndex = 2; }).toThrow(TypeError);
    expect(() => { (engine as unknown as { values: object }).values = {}; }).toThrow(TypeError);
    expect(engine.currentStepIndex).toBe(0);
  });

  it('passes values and skipped step ids to onAfterSubmit', async () => {
    const onAfterSubmit = vi.fn();
    const engine = new FormEngine(multiStepDefinition, { name: 'Ada', accountType: 'personal' }, { onAfterSubmit });
    await engine.next();
    await engine.submit(() => {});
    expect(onAfterSubmit).toHaveBeenCalledWith({ name: 'Ada', accountType: 'personal' }, []);
  });

  it('runs the step hooks for next, back and auto-advance with their reason', async () => {
    const reasons: string[] = [];
    const engine = new FormEngine(multiStepDefinition, { name: 'Ada' }, { onAfterStepChange: ({ reason }) => { reasons.push(reason); } });
    await engine.next();
    await engine.back();
    await autoAdvance(engine);
    expect(reasons).toEqual(['next', 'back', 'autoAdvance']);
  });

  it('lets onBeforeStepChange cancel back', async () => {
    const engine = new FormEngine(multiStepDefinition, { name: 'Ada' }, { onBeforeStepChange: ({ reason }) => reason !== 'back' });
    await engine.next();
    expect(await engine.back()).toBe(false);
    expect(engine.currentStep?.id).toBe('payment');
  });
});
