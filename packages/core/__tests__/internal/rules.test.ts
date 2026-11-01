import { describe, expect, it } from 'vitest';
import { FormEngine, type FormDefinition, type FormField } from '../../src';
import { fieldRules, matrixView } from '../../src/internal';

const columns = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No', disabled: [{ field: 'locked', eq: true }] },
];

const definition: FormDefinition = {
  formatVersion: '1.8',
  id: 'survey',
  title: 'Survey',
  submit: { label: 'Send' },
  fields: [
    { key: 'locked', type: 'checkbox', label: 'Locked' },
    { key: 'note', type: 'text', label: 'Note', readOnly: [{ field: 'locked', eq: true }] },
    {
      key: 'grid',
      type: 'section',
      title: 'Grid',
      layout: 'matrix',
      fields: [
        { key: 'speed', type: 'radio', label: 'Speed', options: columns },
        { key: 'price', type: 'radio', label: 'Price', options: columns },
      ],
    },
  ],
};

const field = (engine: FormEngine, key: string) => engine.visibleFields.find((candidate) => candidate.key === key) as FormField;

describe('field rules', () => {
  it('resolves readOnly and disabled options against the current values', () => {
    const engine = new FormEngine(definition, { locked: true });
    const speed = field(engine, 'speed');
    expect(fieldRules(engine, field(engine, 'note')).readOnly).toBe(true);
    expect(fieldRules(engine, speed).options?.map((option) => option.disabled)).toEqual([undefined, true]);
    engine.setValue('locked', false);
    expect(fieldRules(engine, field(engine, 'note')).readOnly).toBe(false);
    expect(fieldRules(engine, speed).options?.map((option) => option.disabled)).toEqual([undefined, false]);
  });

  it('resolves disabled on the matrix columns of a row', () => {
    const engine = new FormEngine(definition, { locked: true });
    const price = field(engine, 'price');
    expect(matrixView(engine, price, columns, 1)).toEqual({ columns: [columns[0], { ...columns[1], disabled: true }], row: 1 });
    expect(matrixView(engine, price, undefined, 1)).toBeUndefined();
  });
});
