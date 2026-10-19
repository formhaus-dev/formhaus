import type { FormDefinition, FormStep } from '../../src';
import { FormEngine } from '../../src/engine';

export const planStep: FormStep = {
  id: 'plan',
  title: 'Plan',
  fields: [
    {
      key: 'plan',
      type: 'select',
      label: 'Plan',
      options: [
        { value: 'team', label: 'Team' },
        { value: 'solo', label: 'Solo' },
      ],
      validation: { required: true },
    },
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
  ],
};

export const confirmStep: FormStep = { id: 'confirm', title: 'Confirm', fields: [{ key: 'agree', type: 'checkbox', label: 'Agree' }] };

export const base: FormDefinition = { id: 'signup', title: 'Sign up', submit: { label: 'Send' }, steps: [planStep, confirmStep] };

export const extended: FormDefinition = {
  ...base,
  steps: [
    planStep,
    { id: 'team', title: 'Team', fields: [{ key: 'company', type: 'text', label: 'Company', validation: { required: true } }] },
    { id: 'billing', title: 'Billing', fields: [{ key: 'cycle', type: 'text', label: 'Billing cycle', defaultValue: 'monthly' }] },
    confirmStep,
  ],
};

export const ids = (engine: FormEngine) => engine.visibleSteps.map(({ id }) => id);

export function answered(definition = base) {
  const engine = new FormEngine(definition);
  engine.setValue('plan', 'team');
  engine.setValue('name', 'Ada');
  return engine;
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
