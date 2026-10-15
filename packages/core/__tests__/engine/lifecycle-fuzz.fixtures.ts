import fc from 'fast-check';
import type { FormDefinition } from '../../src/types';

const wizard: FormDefinition = {
  id: 'fuzz-wizard',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'start',
      title: '',
      fields: [
        {
          key: 'kind',
          type: 'radio',
          label: 'Kind',
          validation: { required: true },
          options: [
            { value: 'business', label: 'Business' },
            { value: 'personal', label: 'Personal' },
          ],
        },
        { key: 'agree', type: 'checkbox', label: 'Agree' },
        { key: 'reason', type: 'text', label: 'Reason', show: [{ field: 'agree', eq: true }], validation: { required: true } },
      ],
      routes: [{ to: 'company', show: [{ field: 'kind', eq: 'business' }] }, { to: 'person' }],
    },
    {
      id: 'company',
      title: '',
      skip: { label: 'Later' },
      fields: [
        { key: 'company', type: 'text', label: 'Company', validation: { required: true } },
        { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', eq: 'Acme' }], defaultValue: 'EU1' },
      ],
      routes: [{ to: 'final' }],
    },
    {
      id: 'person',
      title: '',
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
        { key: 'nick', type: 'text', label: 'Nick', show: [{ field: 'name', eq: 'Ada' }] },
      ],
    },
    {
      id: 'extra',
      title: '',
      show: [{ field: 'name', in: ['Ada', 'vip'] }],
      skip: { label: 'Skip' },
      fields: [{ key: 'perk', type: 'text', label: 'Perk', validation: { required: true } }],
    },
    {
      id: 'final',
      title: '',
      skip: { label: 'Skip and send' },
      fields: [
        { key: 'note', type: 'text', label: 'Note', validation: { minLength: 3 } },
        { key: 'extraNote', type: 'text', label: 'Extra', show: [{ field: 'note', eq: 'more' }] },
      ],
    },
  ],
};

const flat: FormDefinition = {
  id: 'fuzz-flat',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
    {
      key: 'plan',
      type: 'select',
      label: 'Plan',
      options: [
        { value: 'pro', label: 'Pro' },
        { value: 'free', label: 'Free' },
      ],
    },
    { key: 'seats', type: 'text', label: 'Seats', show: [{ field: 'plan', eq: 'pro' }], validation: { required: true } },
    { key: 'coupon', type: 'text', label: 'Coupon', show: [{ field: 'seats', eq: '10' }] },
  ],
};

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

export interface FuzzCase {
  definition: FormDefinition;
  valid: Record<string, unknown>;
  values: Record<string, unknown[]>;
  initial?: Record<string, unknown[]>;
  groups?: string[];
  serverErrors?: string[];
}

export const fuzzCases: FuzzCase[] = [
  {
    definition: wizard,
    valid: { kind: 'personal', name: 'Bob', company: 'Other', note: 'hello', perk: 'gold' },
    values: {
      kind: ['business', 'personal', 'personal', undefined],
      agree: [true, false, false],
      reason: ['because', 'because', ''],
      company: ['Acme', 'Other', 'Other', ''],
      vat: ['EU2', ''],
      name: ['Ada', 'vip', 'Bob', 'Bob', ''],
      nick: ['A'],
      perk: ['gold', 'gold', ''],
      note: ['more', 'hello', 'hello', 'x'],
      extraNote: ['yes'],
    },
  },
  {
    definition: flat,
    valid: { email: 'a@b.co', plan: 'free' },
    values: {
      email: ['a@b.co', 'a@b.co', 'bad', ''],
      plan: ['pro', 'free', undefined],
      seats: ['10', '2', '2', ''],
      coupon: ['SAVE'],
    },
  },
  {
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
  },
];

export type Outcome = 'allow' | 'deny' | 'fail';

export type FuzzCommand =
  | { type: 'set'; key: string; value: unknown }
  | { type: 'setErrors'; keys: string[] }
  | { type: 'jump'; key: string }
  | { type: 'next' | 'back' | 'submit' | 'skip' | 'cancel' }
  | { type: 'reset'; filled: boolean }
  | { type: 'add'; key: string }
  | { type: 'remove'; key: string; index: number }
  | { type: 'settle'; index: number; outcome: Outcome };

export function commandArbitrary(fuzz: FuzzCase): fc.Arbitrary<FuzzCommand> {
  const keys = Object.keys(fuzz.values);
  const set = fc
    .constantFrom(...keys)
    .chain((key) => fc.constantFrom(...fuzz.values[key]).map((value): FuzzCommand => ({ type: 'set', key, value })));
  return fc.oneof(
    { arbitrary: set, weight: 3 },
    {
      arbitrary: fc
        .subarray([...keys, 'ghost'], { minLength: 0, maxLength: 3 })
        .map((errorKeys): FuzzCommand => ({ type: 'setErrors', keys: errorKeys })),
      weight: 1,
    },
    { arbitrary: fc.constantFrom(...keys).map((key): FuzzCommand => ({ type: 'jump', key })), weight: 1 },
    { arbitrary: fc.constantFrom<FuzzCommand>({ type: 'next' }, { type: 'back' }, { type: 'submit' }, { type: 'skip' }), weight: 6 },
    { arbitrary: fc.constant<FuzzCommand>({ type: 'cancel' }), weight: 2 },
    { arbitrary: fc.boolean().map((filled): FuzzCommand => ({ type: 'reset', filled })), weight: 1 },
    ...(fuzz.groups
      ? [
          { arbitrary: fc.constantFrom(...fuzz.groups).map((key): FuzzCommand => ({ type: 'add', key })), weight: 2 },
          {
            arbitrary: fc.record({ type: fc.constant('remove' as const), key: fc.constantFrom(...fuzz.groups), index: fc.nat({ max: 3 }) }),
            weight: 2,
          },
        ]
      : []),
    {
      arbitrary: fc.record({
        type: fc.constant('settle' as const),
        index: fc.nat({ max: 4 }),
        outcome: fc.constantFrom<Outcome>('allow', 'allow', 'allow', 'deny', 'fail'),
      }),
      weight: 5,
    },
  );
}

export function initialValues(fuzz: FuzzCase): fc.Arbitrary<Record<string, unknown>> {
  return fc
    .record(Object.fromEntries(Object.entries(fuzz.initial ?? fuzz.values).map(([key, values]) => [key, fc.constantFrom(...values)])), {
      requiredKeys: [],
    })
    .map((values) => ({ ...fuzz.valid, ...values }));
}
