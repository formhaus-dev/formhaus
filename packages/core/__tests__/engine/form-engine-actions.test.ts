import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { autoAdvance } from '../../src/internal';
import { multiStepDefinition } from './form-engine-steps.fixtures';

describe('engine actions', () => {
  it('exposes state as read-only getters', () => {
    const engine = new FormEngine(multiStepDefinition);
    expect(() => {
      (engine as unknown as { currentStepIndex: number }).currentStepIndex = 2;
    }).toThrow(TypeError);
    expect(() => {
      (engine as unknown as { values: object }).values = {};
    }).toThrow(TypeError);
    expect(engine.currentStepIndex).toBe(0);
  });

  it('runs the step hooks for next, back and auto-advance with their reason', async () => {
    const reasons: string[] = [];
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ada' },
      {
        onAfterStepChange: ({ reason }) => {
          reasons.push(reason);
        },
      },
    );
    await engine.next();
    await engine.back();
    await autoAdvance(engine);
    expect(reasons).toEqual(['next', 'back', 'autoAdvance']);
  });
});
