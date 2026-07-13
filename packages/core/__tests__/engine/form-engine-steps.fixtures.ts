import type { FormDefinition } from '../../src/types';

export const multiStepDefinition: FormDefinition = {
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
      fields: [{
        key: 'method',
        type: 'select',
        label: 'Method',
        options: [{ value: 'bank', label: 'Bank' }],
      }],
    },
  ],
};
