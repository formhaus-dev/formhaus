import type { FormDefinition } from '../../src/types';
import type { FuzzCase } from './lifecycle-fuzz.fixtures';

const groups: FormDefinition = {
  formatVersion: '1.1',
  id: 'fuzz-groups',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'start',
      title: '',
      fields: [
        { key: 'company', type: 'checkbox', label: 'Company' },
        {
          key: 'billing',
          type: 'section',
          title: 'Billing',
          show: [{ field: 'company', eq: true }],
          fields: [{ key: 'street', type: 'text', label: 'Street', validation: { required: true } }],
        },
      ],
    },
    {
      id: 'people',
      title: '',
      skip: { label: 'Later' },
      fields: [
        {
          key: 'crew',
          type: 'group',
          label: 'Crew',
          defaultItems: 1,
          validation: { required: true, maxLength: 3 },
          fields: [
            { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
            {
              key: 'diet',
              type: 'select',
              label: 'Diet',
              defaultValue: 'none',
              options: [
                { value: 'none', label: 'None' },
                { value: 'other', label: 'Other' },
              ],
            },
            { key: 'dietNote', type: 'text', label: 'Details', show: [{ field: 'diet', eq: 'other' }], validation: { required: true } },
            { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', eq: true }] },
            { key: 'again', type: 'text', label: 'Again', validation: { matchField: 'name' } },
          ],
        },
        { key: 'lead', type: 'text', label: 'Lead', show: [{ field: 'crew', notEmpty: true }] },
      ],
    },
    { id: 'final', title: '', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
  ],
};

export const groupsCase: FuzzCase = {
  definition: groups,
  valid: { company: false, crew: [{ name: 'Ada' }], note: 'n' },
  groups: ['crew'],
  serverErrors: ['crew.0.name', 'crew.1.dietNote', 'crew'],
  values: {
    company: [true, false, false],
    street: ['Main', ''],
    'crew.0.name': ['Ada', ' ', 'Bo'],
    'crew.1.name': ['Bo', ''],
    'crew.0.diet': ['other', 'none'],
    'crew.1.diet': ['other'],
    'crew.0.dietNote': ['Vegan', ''],
    'crew.2.vat': ['NL1'],
    'crew.0.again': ['Ada', 'x'],
    crew: [[], [{ name: 'Z', diet: 'other' }], [{ name: 'Q' }, { name: 'R', vat: 'X' }]],
    lead: ['Me'],
    note: ['hi'],
  },
  initial: {
    company: [true, false],
    street: ['Main'],
    crew: [undefined, [], [{ name: 'Ada', diet: 'other' }], [{ name: 'A' }, { name: '' }, { name: 'C', vat: 'NL' }]],
    lead: ['Me'],
  },
};
