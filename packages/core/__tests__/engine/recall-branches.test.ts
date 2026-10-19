import { describe, expect, it, vi } from 'vitest';
import { checkDefinition, FormEngine, recallText, type FormDefinition, type FormField } from '../../src';
import { recalled } from '../../src/internal';
import { asStored } from '../../src/engine/recall-format';

const plan = (label: string): FormField => ({
  key: 'plan',
  type: 'select',
  label: 'Plan',
  options: [{ value: 'x', label }],
});

const definition: FormDefinition = {
  formatVersion: '1.5',
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'start',
      title: 'Start',
      fields: [
        {
          key: 'way',
          type: 'radio',
          label: 'Way',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      ],
      routes: [{ to: 'b', show: [{ field: 'way', eq: 'b' }] }],
    },
    {
      id: 'a',
      title: 'A',
      fields: [{ key: 'credential', type: 'text', label: 'Code' }, plan('Plan A'), { key: 'qty', type: 'text', label: 'Qty' }],
      routes: [{ to: 'review' }],
    },
    {
      id: 'b',
      title: 'B',
      fields: [{ key: 'credential', type: 'password', label: 'Password' }, plan('Plan B'), { key: 'qty', type: 'number', label: 'Qty' }],
    },
    { id: 'review', title: 'Review', description: '[{{credential}}] [{{plan}}] [{{qty}}]', fields: [] },
  ],
};

const review = (values: Record<string, unknown>, format = vi.fn(asStored)) => {
  const engine = new FormEngine(definition, values);
  return { format, text: recallText(definition, definition.steps![3].description!, engine.getSubmitValues(), { format }), engine };
};

describe('recall across route branches', () => {
  it('shows nothing for a key that is a password on any branch', () => {
    const { text, format } = review({ way: 'b', credential: 'hunter2', plan: 'x', qty: 2 });
    expect(text).toBe('[] [Plan B] [2]');
    expect(format.mock.calls.map(([, field]) => field.key)).toEqual(['plan', 'qty']);
    expect(review({ way: 'a', credential: 'code', plan: 'x', qty: '2' }).text).toBe('[] [Plan A] [2]');
  });

  it('formats the field of the active branch', () => {
    const { format } = review({ way: 'b', qty: 2 });
    expect(format).toHaveBeenCalledWith(2, definition.steps![2].fields[2], 'en');
  });

  it('resolves step texts in the engine with the active branch', () => {
    const { engine } = review({ way: 'b', credential: 'hunter2', plan: 'x' });
    expect(recalled(engine, definition.steps![3]).description).toBe('[] [Plan B] []');
  });

  it('warns about a password on any branch', () => {
    const codes = checkDefinition(definition).map(({ code, path }) => `${code} ${path}`);
    expect(codes).toContain('recall-sensitive-field /steps/3/description');
  });
});
