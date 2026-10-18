import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine, type FormDefinition, type FormField, type FormStep } from '../../src';

const text = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });
const form = (steps: FormStep[]): FormDefinition => ({ id: 'p', title: 'P', submit: { label: 'Send' }, steps });
const choice = (key: string, values: string[], extra: Partial<FormField> = {}): FormField => ({
  key,
  type: 'radio',
  label: key,
  options: values.map((value) => ({ value, label: value })),
  ...extra,
});

describe('duplicate keys', () => {
  const branches = (): FormDefinition =>
    form([
      {
        id: 'kind',
        title: 'Kind',
        fields: [choice('kind', ['biz', 'me'])],
        routes: [{ to: 'biz', show: [{ field: 'kind', eq: 'biz' }] }, { to: 'me' }],
      },
      {
        id: 'biz',
        title: 'Biz',
        fields: [text('name', { label: 'Company', validation: { required: 'Company name' } })],
        routes: [{ to: 'end' }],
      },
      { id: 'me', title: 'Me', fields: [text('name', { label: 'Your name', validation: { minLength: 3 } })] },
      { id: 'end', title: 'End', fields: [text('note')] },
    ]);

  it('allows the same key on route branches that never meet', () => {
    expect(checkDefinition(branches())).toEqual([]);
  });

  it('rejects the same key on steps of one path', () => {
    const definition = branches();
    definition.steps![1].routes = [];
    expect(checkDefinition(definition).map(({ code, path }) => `${code} ${path}`)).toContain('duplicate-key /steps/2/fields/0/key');
  });

  it('rejects the same key twice in one step or form', () => {
    const definition: FormDefinition = { id: 's', title: 'S', submit: { label: 'Send' }, fields: [text('a'), text('a')] };
    expect(() => new FormEngine(definition)).toThrow('already used by /fields/0 on the same path');
  });
});
