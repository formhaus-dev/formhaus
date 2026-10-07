import type { FormDefinition } from '../../src/types';

export function routedDefinition(): FormDefinition {
  return {
    id: 'routes', title: 'Account', submit: { label: 'Save' }, steps: [
      { id: 'kind', title: 'Kind', fields: [
        { key: 'kind', type: 'radio', label: 'Kind', validation: { required: true }, autoAdvance: true },
        { key: 'enabled', type: 'checkbox', label: 'Enabled' },
      ], routes: [
        { to: 'business', show: [{ field: 'kind', eq: 'business' }] },
        { to: 'personal' },
      ] },
      { id: 'business', title: 'Business', fields: [
        { key: 'company', type: 'text', label: 'Company', validation: { required: true } },
      ], routes: [{ to: 'review' }] },
      { id: 'personal', title: 'Personal', fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
      ], routes: [{ to: 'review' }] },
      { id: 'review', title: 'Review', fields: [] },
    ],
  };
}
