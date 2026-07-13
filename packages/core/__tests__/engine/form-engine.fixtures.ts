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

export const conditionalDefinition: FormDefinition = {
  id: 'conditional',
  title: 'Conditional',
  submit: { label: 'Submit' },
  fields: [
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { value: 'MX', label: 'Mexico' },
        { value: 'US', label: 'US' },
      ],
    },
    { key: 'clabe', type: 'text', label: 'CLABE', show: [{ field: 'country', eq: 'MX' }] },
    { key: 'routing', type: 'text', label: 'Routing', show: [{ field: 'country', eq: 'US' }] },
  ],
};
