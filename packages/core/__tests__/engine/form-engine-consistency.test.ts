import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateField } from '../../src/validation';
import type { FormDefinition } from '../../src/types';

const passwordSteps: FormDefinition = {
  id: 'passwords', title: '', submit: { label: 'Save' }, steps: [
    { id: 's1', title: '', fields: [
      { key: 'password', type: 'password', label: 'Password' },
      { key: 'confirm', type: 'password', label: 'Confirm', validation: { matchField: 'password' } },
    ] },
    { id: 's2', title: '', fields: [] },
  ],
};

const countrySteps: FormDefinition = {
  id: 'country', title: '', submit: { label: 'Save' }, steps: [
    { id: 'A', title: '', fields: [{ key: 'country', type: 'text', label: 'Country' }] },
    { id: 'B', title: '', show: [{ field: 'country', eq: 'US' }], fields: [{ key: 'state', type: 'text', label: 'State' }] },
    { id: 'C', title: '', fields: [{ key: 'email', type: 'email', label: 'Email' }] },
  ],
};

describe('engine consistency', () => {
  it('clears a cross-field error once the referenced field fixes it', () => {
    const engine = new FormEngine(passwordSteps, { password: 'a', confirm: 'b' });
    expect(engine.nextStep()).toBe(false);
    expect(engine.errors.confirm).toBe('Fields must match');
    engine.setValue('password', 'b');
    expect(engine.errors.confirm).toBeUndefined();
    expect(engine.nextStep()).toBe(true);
    engine.prevStep();
    expect(engine.errors).toEqual({});
  });

  it('keeps the current step when an earlier answer reveals a step before it', () => {
    const engine = new FormEngine(countrySteps, { country: 'DE' });
    engine.nextStep();
    expect(engine.currentStep?.id).toBe('C');
    engine.setValue('country', 'US');
    expect(engine.currentStep?.id).toBe('C');
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['A', 'B', 'C']);
  });

  it('returns to the nearest earlier step when the current step is hidden', () => {
    const engine = new FormEngine(countrySteps, { country: 'US' });
    engine.nextStep();
    expect(engine.currentStep?.id).toBe('B');
    engine.setValue('country', 'DE');
    expect(engine.currentStep?.id).toBe('A');
  });

  it('treats an unchecked consent checkbox or switch as missing for required', () => {
    for (const type of ['checkbox', 'switch']) {
      const field = { key: 'terms', type, label: 'Terms', validation: { required: 'Accept the terms' } };
      expect(validateField(field, false, {})).toBe('Accept the terms');
      expect(validateField(field, true, {})).toBeNull();
    }
    const number = { key: 'n', type: 'number', label: 'N', validation: { required: true } };
    expect(validateField(number, 0, {})).toBeNull();
  });
});
