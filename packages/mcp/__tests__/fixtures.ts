export const linear = {
  id: 'signup',
  title: 'Sign up',
  submit: { label: 'Create' },
  steps: [
    { id: 'name', title: 'Name', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] },
    { id: 'email', title: 'Email', fields: [{ key: 'email', type: 'email', label: 'Email', validation: { required: true } }] },
  ],
};

export const branching = {
  id: 'account',
  title: 'Account',
  submit: { label: 'Create' },
  steps: [
    {
      id: 'kind',
      title: 'Kind',
      next: false,
      fields: [{
        key: 'kind', type: 'radio', label: 'Kind', autoAdvance: true, validation: { required: true },
        options: [{ value: 'business', label: 'Business' }, { value: 'personal', label: 'Personal' }, { value: 'none', label: 'None' }],
      }],
      routes: [
        { to: 'business', show: [{ field: 'kind', eq: 'business' }] },
        { to: null, show: [{ field: 'kind', eq: 'none' }] },
        { to: 'personal' },
      ],
    },
    {
      id: 'business',
      title: 'Company',
      fields: [
        { key: 'company', type: 'text', label: 'Company', validation: { required: true } },
        { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', notEmpty: true }] },
      ],
      routes: [{ to: 'review' }],
    },
    { id: 'personal', title: 'Personal', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }], routes: [{ to: 'review' }] },
    {
      id: 'review',
      title: 'Review',
      skip: { label: 'Not now' },
      fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
    },
  ],
};

export const skippable = {
  id: 'profile',
  title: 'Profile',
  submit: { label: 'Save' },
  steps: [
    { id: 'about', title: 'About', skip: { label: 'Skip' }, fields: [{ key: 'bio', type: 'textarea', label: 'Bio', validation: { required: true } }] },
    { id: 'contact', title: 'Contact', fields: [{ key: 'phone', type: 'phone', label: 'Phone' }] },
  ],
};
