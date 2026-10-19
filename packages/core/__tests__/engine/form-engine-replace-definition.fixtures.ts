import type { FormDefinition, FormStep } from '../../src';
import { FormEngine } from '../../src/engine';

export const countryStep: FormStep = {
  id: 'country',
  title: 'Country',
  fields: [
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'de', label: 'Germany' },
      ],
      validation: { required: true },
    },
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
  ],
};

export const confirmStep: FormStep = { id: 'confirm', title: 'Confirm', fields: [{ key: 'agree', type: 'checkbox', label: 'Agree' }] };

export const base: FormDefinition = { id: 'kyc', title: 'KYC', submit: { label: 'Send' }, steps: [countryStep, confirmStep] };

export const extended: FormDefinition = {
  ...base,
  steps: [
    countryStep,
    { id: 'tax', title: 'Tax', fields: [{ key: 'ssn', type: 'text', label: 'SSN', validation: { required: true } }] },
    { id: 'address', title: 'Address', fields: [{ key: 'street', type: 'text', label: 'Street', defaultValue: 'Main St' }] },
    confirmStep,
  ],
};

export const ids = (engine: FormEngine) => engine.visibleSteps.map(({ id }) => id);

export function answered(definition = base) {
  const engine = new FormEngine(definition);
  engine.setValue('country', 'us');
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
