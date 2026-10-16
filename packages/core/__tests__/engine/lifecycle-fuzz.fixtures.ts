import fc from 'fast-check';
import type { FormDefinition } from '../../src/types';
import { groupsCase } from './lifecycle-fuzz.groups';

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
      vat: ['EU2', '', undefined],
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
  groupsCase,
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
