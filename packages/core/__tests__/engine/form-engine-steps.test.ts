import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { StepValidateFn } from '../../src/engine';
import type { FormDefinition } from '../../src/types';

const multiStepDefinition: FormDefinition = {
  id: 'multi',
  title: 'Multi-Step',
  submit: { label: 'Submit' },
  steps: [
    {
      id: 'personal',
      title: 'Personal Info',
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
    },
    {
      id: 'business',
      title: 'Business Info',
      fields: [{ key: 'company', type: 'text', label: 'Company' }],
      show: [{ field: 'accountType', eq: 'business' }],
    },
    {
      id: 'payment',
      title: 'Payment',
      fields: [
        {
          key: 'method',
          type: 'select',
          label: 'Method',
          options: [{ value: 'bank', label: 'Bank' }],
        },
      ],
    },
  ],
};

describe('FormEngine - Multi-Step', () => {
  describe('step navigation', () => {
    it('starts on step 0', () => {
      const engine = new FormEngine(multiStepDefinition);
      expect(engine.currentStepIndex).toBe(0);
      expect(engine.isFirstStep).toBe(true);
    });

    it('isMultiStep returns true for step-based definition', () => {
      const engine = new FormEngine(multiStepDefinition);
      expect(engine.isMultiStep).toBe(true);
    });

    it('nextStep validates before advancing', () => {
      const engine = new FormEngine(multiStepDefinition);
      // Name is required, so nextStep should fail
      const result = engine.nextStep();
      expect(result).toBe(false);
      expect(engine.currentStepIndex).toBe(0);
      expect(engine.errors.name).toBe('This field is required');
    });

    it('nextStep advances when valid', () => {
      const engine = new FormEngine(multiStepDefinition, { name: 'John' });
      const result = engine.nextStep();
      expect(result).toBe(true);
      // Business step is hidden (accountType != business), so we skip to payment
      expect(engine.currentStep?.id).toBe('payment');
    });

    it('prevStep goes back', () => {
      const engine = new FormEngine(multiStepDefinition, { name: 'John' });
      engine.nextStep();
      engine.prevStep();
      expect(engine.currentStep?.id).toBe('personal');
    });

    it('prevStep on first step is a no-op', () => {
      const engine = new FormEngine(multiStepDefinition);
      engine.prevStep();
      expect(engine.currentStepIndex).toBe(0);
    });

    it('nextStep on last step is a no-op', () => {
      const engine = new FormEngine(multiStepDefinition, { name: 'John' });
      engine.nextStep(); // Go to payment (business hidden)
      const result = engine.nextStep(); // Already on last step
      expect(result).toBe(false);
    });
  });

  describe('conditional steps', () => {
    it('hides steps based on show conditions', () => {
      const engine = new FormEngine(multiStepDefinition);
      const visibleIds = engine.visibleSteps.map((s) => s.id);
      expect(visibleIds).toEqual(['personal', 'payment']);
      expect(visibleIds).not.toContain('business');
    });

    it('shows step when condition is met', () => {
      const engine = new FormEngine(multiStepDefinition, { accountType: 'business' });
      const visibleIds = engine.visibleSteps.map((s) => s.id);
      expect(visibleIds).toEqual(['personal', 'business', 'payment']);
    });
  });

  describe('visibleFields in multi-step', () => {
    it('returns fields of current step only', () => {
      const engine = new FormEngine(multiStepDefinition);
      const keys = engine.visibleFields.map((f) => f.key);
      expect(keys).toEqual(['name']);
    });
  });

  describe('progress', () => {
    it('reports correct progress', () => {
      const engine = new FormEngine(multiStepDefinition);
      // 2 visible steps (personal, payment)
      expect(engine.progress).toEqual({ current: 1, total: 2 });
    });

    it('updates when step becomes visible', () => {
      const engine = new FormEngine(multiStepDefinition);
      engine.setValue('accountType', 'business');
      // Now 3 visible steps
      expect(engine.progress.total).toBe(3);
    });
  });

  describe('goToStepWithField', () => {
    it('navigates to step containing field', () => {
      const engine = new FormEngine(multiStepDefinition, { name: 'John' });
      engine.goToStepWithField('method');
      // method is in 'payment' step, which is index 1 in visible steps (personal=0, payment=1)
      expect(engine.currentStep?.id).toBe('payment');
    });

    it('no-op when field is in hidden step', () => {
      const engine = new FormEngine(multiStepDefinition);
      engine.goToStepWithField('company'); // company is in hidden business step
      expect(engine.currentStepIndex).toBe(0); // Unchanged
    });

    it('no-op when field does not exist', () => {
      const engine = new FormEngine(multiStepDefinition);
      engine.goToStepWithField('nonexistent');
      expect(engine.currentStepIndex).toBe(0);
    });
  });

  describe('getSubmitValues for multi-step', () => {
    it('returns all visible fields across all steps', () => {
      const engine = new FormEngine(multiStepDefinition, { name: 'John', method: 'bank' });
      const values = engine.getSubmitValues();
      expect(values.name).toBe('John');
      expect(values.method).toBe('bank');
      // company is in hidden step, should not appear
      expect(values.company).toBeUndefined();
    });

    it('includes fields from conditionally shown step', () => {
      const engine = new FormEngine(multiStepDefinition, {
        name: 'John',
        accountType: 'business',
        company: 'Acme',
        method: 'bank',
      });
      const values = engine.getSubmitValues();
      expect(values.company).toBe('Acme');
    });
  });

  describe('setErrors navigates to step', () => {
    it('navigates to step containing first errored field', () => {
      const engine = new FormEngine(multiStepDefinition, { name: 'John' });
      engine.nextStep(); // Go to payment
      engine.setErrors({ name: 'Server error on name' });
      // Should navigate back to personal step
      expect(engine.currentStep?.id).toBe('personal');
    });
  });

  describe('cascade clears hidden step fields', () => {
    it('clears field values when their step becomes hidden', () => {
      const engine = new FormEngine(multiStepDefinition, {
        accountType: 'business',
        company: 'Acme',
      });
      expect(engine.values.company).toBe('Acme');

      engine.setValue('accountType', 'personal');
      expect(engine.values.company).toBeUndefined();
    });
  });

  describe('nextStepAsync', () => {
    it('works without onStepValidate (same as sync)', async () => {
      const engine = new FormEngine(multiStepDefinition, { name: 'John' });
      const result = await engine.nextStepAsync();
      expect(result).toBe(true);
      expect(engine.currentStep?.id).toBe('payment');
    });

    it('runs sync validation first', async () => {
      const onStepValidate = vi.fn().mockResolvedValue(null);
      const engine = new FormEngine(multiStepDefinition, {}, { onStepValidate });
      const result = await engine.nextStepAsync();
      expect(result).toBe(false);
      expect(engine.errors.name).toBe('This field is required');
      expect(onStepValidate).not.toHaveBeenCalled();
    });

    it('calls onStepValidate after sync passes', async () => {
      const onStepValidate = vi.fn().mockResolvedValue(null);
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      await engine.nextStepAsync();
      expect(onStepValidate).toHaveBeenCalledWith('personal', engine.values);
    });

    it('blocks transition when onStepValidate returns errors', async () => {
      const onStepValidate: StepValidateFn = async () => ({ name: 'Already taken' });
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      const result = await engine.nextStepAsync();
      expect(result).toBe(false);
      expect(engine.errors.name).toBe('Already taken');
      expect(engine.currentStep?.id).toBe('personal');
    });

    it('allows transition when onStepValidate returns null', async () => {
      const onStepValidate: StepValidateFn = async () => null;
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      const result = await engine.nextStepAsync();
      expect(result).toBe(true);
      expect(engine.currentStep?.id).toBe('payment');
    });

    it('allows transition when onStepValidate returns void', async () => {
      const onStepValidate: StepValidateFn = async () => {};
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      const result = await engine.nextStepAsync();
      expect(result).toBe(true);
      expect(engine.currentStep?.id).toBe('payment');
    });

    it('sets stepValidating to true during async validation', async () => {
      let capturedValidating = false;
      const onStepValidate: StepValidateFn = async () => {
        capturedValidating = engine.stepValidating;
        return null;
      };
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      await engine.nextStepAsync();
      expect(capturedValidating).toBe(true);
      expect(engine.stepValidating).toBe(false);
    });

    it('rejects concurrent calls while validating', async () => {
      let resolve: () => void;
      const onStepValidate: StepValidateFn = () =>
        new Promise((r) => { resolve = () => r(null); });
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });

      const first = engine.nextStepAsync();
      const second = await engine.nextStepAsync();
      expect(second).toBe(false);

      resolve!();
      const firstResult = await first;
      expect(firstResult).toBe(true);
    });

    it('resets stepValidating on exception', async () => {
      const onStepValidate: StepValidateFn = async () => {
        throw new Error('Network failure');
      };
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      await expect(engine.nextStepAsync()).rejects.toThrow('Network failure');
      expect(engine.stepValidating).toBe(false);
      expect(engine.currentStep?.id).toBe('personal');
    });

    it('discards result when step changed during validation', async () => {
      const resolvers: Array<(v: null) => void> = [];
      const onStepValidate: StepValidateFn = () =>
        new Promise((r) => { resolvers.push(r); });
      const engine = new FormEngine(
        multiStepDefinition,
        { name: 'John', accountType: 'business' },
        { onStepValidate },
      );

      const firstPromise = engine.nextStepAsync();
      resolvers[0]!(null);
      await firstPromise;
      expect(engine.currentStep?.id).toBe('business');

      const secondPromise = engine.nextStepAsync();
      engine.prevStep();
      resolvers[1]!(null);
      const result = await secondPromise;
      expect(result).toBe(false);
      expect(engine.currentStep?.id).toBe('personal');
    });

    it('routes errors for hidden fields to topLevelErrors', async () => {
      const onStepValidate: StepValidateFn = async () => ({
        name: 'Server error',
        nonexistent: 'Unknown field error',
      });
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      await engine.nextStepAsync();
      expect(engine.errors.name).toBe('Server error');
      expect(engine.topLevelErrors).toContain('Unknown field error');
    });

    it('returns false for non-multi-step forms', async () => {
      const singleDefinition: FormDefinition = {
        id: 'single',
        title: 'Single',
        submit: { label: 'Submit' },
        fields: [{ key: 'name', type: 'text', label: 'Name' }],
      };
      const engine = new FormEngine(singleDefinition);
      const result = await engine.nextStepAsync();
      expect(result).toBe(false);
    });

    it('returns false on last step even with onStepValidate', async () => {
      const onStepValidate: StepValidateFn = async () => null;
      const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
      await engine.nextStepAsync();
      const result = await engine.nextStepAsync();
      expect(result).toBe(false);
    });
  });
});
