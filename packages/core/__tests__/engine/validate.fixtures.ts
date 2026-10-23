import type { FormDefinition } from '../../src/types';

export const league: FormDefinition = {
  formatVersion: '1.1',
  id: 'league',
  title: 'League',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'account',
      title: 'Account',
      fields: [
        { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
        { key: 'plan', type: 'text', label: 'Plan' },
        { key: 'company', type: 'text', label: 'Company', show: [{ field: 'plan', eq: 'team' }] },
      ],
    },
    {
      id: 'roster',
      title: 'Roster',
      skip: { label: 'Skip' },
      fields: [
        {
          key: 'players',
          type: 'group',
          label: 'Players',
          fields: [
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'role', type: 'text', label: 'Role', show: [{ field: 'name', notEmpty: true }] },
          ],
        },
      ],
    },
    { id: 'notes', title: 'Notes', fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }] },
  ],
};

export const leagueValues = {
  email: 'ada@example.com',
  plan: 'solo',
  players: [{ name: 'Ada', role: 'Lead' }, { name: '' }],
  notes: 'Hi',
};
