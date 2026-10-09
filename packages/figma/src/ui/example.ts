export const EXAMPLE = JSON.stringify({
  id: 'basic-form',
  title: 'Contact Information',
  submit: { label: 'Submit' },
  fields: [
    { key: 'firstName', type: 'text', label: 'First Name', placeholder: 'Jane', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email Address', placeholder: 'you@example.com', validation: { required: true } },
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      placeholder: 'Choose a country',
      options: [
        { value: 'US', label: 'United States' },
        { value: 'MX', label: 'Mexico' },
      ],
    },
    { key: 'terms', type: 'checkbox', label: 'I agree to terms', validation: { required: true } },
  ],
}, null, 2);
