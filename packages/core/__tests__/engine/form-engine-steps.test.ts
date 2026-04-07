import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormSchema } from '../../src/types';

const multiStepSchema: FormSchema = {
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
      const engine = new FormEngine(multiStepSchema);
      expect(engine.currentStepIndex).toBe(0);
      expect(engine.isFirstStep).toBe(true);
    });

    it('isMultiStep returns true for step-based schema', () => {
      const engine = new FormEngine(multiStepSchema);
      expect(engine.isMultiStep).toBe(true);
    });

    it('nextStep validates before advancing', () => {
      const engine = new FormEngine(multiStepSchema);
      // Name is required, so nextStep should fail
      const result = engine.nextStep();
      expect(result).toBe(false);
      expect(engine.currentStepIndex).toBe(0);
      expect(engine.errors.name).toBe('This field is required');
    });

    it('nextStep advances when valid', () => {
      const engine = new FormEngine(multiStepSchema, { name: 'John' });
      const result = engine.nextStep();
      expect(result).toBe(true);
      // Business step is hidden (accountType != business), so we skip to payment
      expect(engine.currentStep?.id).toBe('payment');
    });

    it('prevStep goes back', () => {
      const engine = new FormEngine(multiStepSchema, { name: 'John' });
      engine.nextStep();
      engine.prevStep();
      expect(engine.currentStep?.id).toBe('personal');
    });

    it('prevStep on first step is a no-op', () => {
      const engine = new FormEngine(multiStepSchema);
      engine.prevStep();
      expect(engine.currentStepIndex).toBe(0);
    });

    it('nextStep on last step is a no-op', () => {
      const engine = new FormEngine(multiStepSchema, { name: 'John' });
      engine.nextStep(); // Go to payment (business hidden)
      const result = engine.nextStep(); // Already on last step
      expect(result).toBe(false);
    });
  });

  describe('conditional steps', () => {
    it('hides steps based on show conditions', () => {
      const engine = new FormEngine(multiStepSchema);
      const visibleIds = engine.visibleSteps.map((s) => s.id);
      expect(visibleIds).toEqual(['personal', 'payment']);
      expect(visibleIds).not.toContain('business');
    });

    it('shows step when condition is met', () => {
      const engine = new FormEngine(multiStepSchema, { accountType: 'business' });
      const visibleIds = engine.visibleSteps.map((s) => s.id);
      expect(visibleIds).toEqual(['personal', 'business', 'payment']);
    });
  });

  describe('visibleFields in multi-step', () => {
    it('returns fields of current step only', () => {
      const engine = new FormEngine(multiStepSchema);
      const keys = engine.visibleFields.map((f) => f.key);
      expect(keys).toEqual(['name']);
    });
  });

  describe('progress', () => {
    it('reports correct progress', () => {
      const engine = new FormEngine(multiStepSchema);
      // 2 visible steps (personal, payment)
      expect(engine.progress).toEqual({ current: 1, total: 2 });
    });

    it('updates when step becomes visible', () => {
      const engine = new FormEngine(multiStepSchema);
      engine.setValue('accountType', 'business');
      // Now 3 visible steps
      expect(engine.progress.total).toBe(3);
    });
  });

  describe('goToStepWithField', () => {
    it('navigates to step containing field', () => {
      const engine = new FormEngine(multiStepSchema, { name: 'John' });
      engine.goToStepWithField('method');
      // method is in 'payment' step, which is index 1 in visible steps (personal=0, payment=1)
      expect(engine.currentStep?.id).toBe('payment');
    });

    it('no-op when field is in hidden step', () => {
      const engine = new FormEngine(multiStepSchema);
      engine.goToStepWithField('company'); // company is in hidden business step
      expect(engine.currentStepIndex).toBe(0); // Unchanged
    });

    it('no-op when field does not exist', () => {
      const engine = new FormEngine(multiStepSchema);
      engine.goToStepWithField('nonexistent');
      expect(engine.currentStepIndex).toBe(0);
    });
  });

  describe('getSubmitValues for multi-step', () => {
    it('returns all visible fields across all steps', () => {
      const engine = new FormEngine(multiStepSchema, { name: 'John', method: 'bank' });
      const values = engine.getSubmitValues();
      expect(values.name).toBe('John');
      expect(values.method).toBe('bank');
      // company is in hidden step, should not appear
      expect(values.company).toBeUndefined();
    });

    it('includes fields from conditionally shown step', () => {
      const engine = new FormEngine(multiStepSchema, {
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
      const engine = new FormEngine(multiStepSchema, { name: 'John' });
      engine.nextStep(); // Go to payment
      engine.setErrors({ name: 'Server error on name' });
      // Should navigate back to personal step
      expect(engine.currentStep?.id).toBe('personal');
    });
  });

  describe('cascade clears hidden step fields', () => {
    it('clears field values when their step becomes hidden', () => {
      const engine = new FormEngine(multiStepSchema, {
        accountType: 'business',
        company: 'Acme',
      });
      expect(engine.values.company).toBe('Acme');

      engine.setValue('accountType', 'personal');
      expect(engine.values.company).toBeUndefined();
    });
  });
});
