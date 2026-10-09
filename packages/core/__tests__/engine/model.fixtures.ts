import fc from 'fast-check';
import type { FormDefinition } from '../../src/types';

export const modelDefinition: FormDefinition = {
  id: 'model', title: '', submit: { label: 'Send' }, steps: [
    { id: 'kind', title: '', fields: [
      { key: 'kind', type: 'radio', label: 'Kind', validation: { required: true },
        options: [{ value: 'business', label: 'Business' }, { value: 'personal', label: 'Personal' }] },
      { key: 'agree', type: 'checkbox', label: 'Agree', validation: { required: true } },
    ], routes: [{ to: 'business', show: [{ field: 'kind', eq: 'business' }] }, { to: 'personal' }] },
    { id: 'business', title: '', fields: [
      { key: 'company', type: 'text', label: 'Company', validation: { required: true } },
    ], routes: [{ to: 'review' }] },
    { id: 'personal', title: '', fields: [
      { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
      { key: 'confirm', type: 'text', label: 'Confirm', validation: { matchField: 'name' } },
    ] },
    { id: 'extra', title: '', show: [{ field: 'name', eq: 'vip' }], fields: [
      { key: 'perk', type: 'text', label: 'Perk' },
    ] },
    { id: 'review', title: '', fields: [
      { key: 'note', type: 'text', label: 'Note', show: [{ field: 'agree', eq: true }] },
    ] },
  ],
};

const fieldValues: Record<string, unknown[]> = {
  kind: ['business', 'personal', undefined],
  agree: [true, false],
  company: ['Acme', ''],
  name: ['Ada', 'vip', ''],
  confirm: ['Ada', 'vip', 'x', ''],
  perk: ['gold'],
  note: ['hello', ''],
};

export type ModelCommand =
  | { type: 'set'; key: string; value: unknown }
  | { type: 'server' | 'jump' | 'validateOne'; key: string }
  | { type: 'next' | 'back' | 'submit' | 'reset' | 'cancel' | 'syncNext' | 'syncBack' }
  | { type: 'settle'; index: number; outcome: 'allow' | 'deny' | 'fail' };

const setCommand = fc.constantFrom(...Object.keys(fieldValues)).chain((key) =>
  fc.constantFrom(...fieldValues[key]).map((value): ModelCommand => ({ type: 'set', key, value })));

export const commandArbitrary: fc.Arbitrary<ModelCommand> = fc.oneof(
  { arbitrary: setCommand, weight: 4 },
  { arbitrary: fc.tuple(fc.constantFrom('server' as const, 'jump' as const, 'validateOne' as const), fc.constantFrom(...Object.keys(fieldValues)))
    .map(([type, key]): ModelCommand => ({ type, key })), weight: 2 },
  { arbitrary: fc.constantFrom<ModelCommand>(
    { type: 'next' }, { type: 'back' }, { type: 'submit' }, { type: 'reset' },
    { type: 'cancel' }, { type: 'syncNext' }, { type: 'syncBack' },
  ), weight: 3 },
  { arbitrary: fc.record({
    type: fc.constant('settle' as const),
    index: fc.nat({ max: 3 }),
    outcome: fc.constantFrom('allow' as const, 'deny' as const, 'fail' as const),
  }), weight: 3 },
);

export const initialValueArbitrary = fc.record(
  Object.fromEntries(Object.entries(fieldValues).map(([key, values]) => [key, fc.constantFrom(...values)])),
  { requiredKeys: [] },
);
