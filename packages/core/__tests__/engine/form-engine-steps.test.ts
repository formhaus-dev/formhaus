import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { multiStepDefinition } from './form-engine-steps.fixtures';

describe('FormEngine - Multi-Step', () => {
  describe('step navigation', () => {
    it('isMultiStep returns true for step-based definition', () => {
      const engine = new FormEngine(multiStepDefinition);
      expect(engine.isMultiStep).toBe(true);
    });
  });
});
