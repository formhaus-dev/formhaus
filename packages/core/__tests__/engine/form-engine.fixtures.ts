import type { FormDefinition } from '../../src/types';

export const basicDefinition: FormDefinition = {
  id: 'basic',
  title: 'Basic Form',
  submit: { label: 'Submit' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};
