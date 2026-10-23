import { describe, expect, it } from 'vitest';
import { checkDefinition, type FormDefinition, type FormField, type FormSection } from '../../src';
import { scalePoints, scaleRange } from '../../src/validation/type-checks';
import { matrixColumns, sameOptions } from '../../src/internal';
import { definitionSlots } from '../../src/i18n/slots';

const field = (overrides: Partial<FormField>): FormField => ({ key: 'a', type: 'scale', label: 'A', ...overrides });
const form = (fields: FormField[], formatVersion = '1.3'): FormDefinition => ({
  formatVersion,
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields,
});

describe('scaleRange', () => {
  it('defaults a scale to 1 to 5', () => {
    expect(scaleRange(field({}))).toEqual([1, 5]);
  });

  it('reads min and max of a scale', () => {
    expect(scaleRange(field({ validation: { min: 0, max: 10 } }))).toEqual([0, 10]);
  });

  it('starts a rating at 1 whatever min says', () => {
    expect(scaleRange(field({ type: 'rating', validation: { min: 3, max: 10 } }))).toEqual([1, 10]);
  });
});

describe('scalePoints', () => {
  it('lists every point of the range', () => {
    expect(scalePoints(field({}))).toEqual([1, 2, 3, 4, 5]);
    expect(scalePoints(field({ validation: { min: 0, max: 10 } }))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(scalePoints(field({ type: 'rating', validation: { min: 3, max: 4 } }))).toEqual([1, 2, 3, 4]);
  });

  it('stops at 11 points and gives none for an inverted range', () => {
    expect(scalePoints(field({ validation: { min: 0, max: 20 } }))).toHaveLength(11);
    expect(scalePoints(field({ validation: { min: 5, max: 1 } }))).toEqual([]);
  });
});

describe('matrixColumns', () => {
  const options = [
    { value: '1', label: 'Disagree' },
    { value: '2', label: 'Agree' },
  ];
  const section = (layout?: 'matrix'): FormSection => ({
    key: 's',
    type: 'section',
    title: 'S',
    layout,
    fields: [{ key: 'goals', type: 'radio', label: 'Goals', options }],
  });

  it('reads the columns from the options of the first row of a matrix', () => {
    expect(matrixColumns(section('matrix'))).toEqual(options);
  });

  it('gives no columns for a plain section or an empty matrix', () => {
    expect(matrixColumns(section())).toBeUndefined();
    expect(matrixColumns({ ...section('matrix'), fields: [] })).toBeUndefined();
  });
});

describe('sameOptions', () => {
  it('compares option images', () => {
    const options = [{ value: 'a', label: 'A', image: 'a.jpg' }];
    expect(sameOptions(options, [{ value: 'a', label: 'A', image: 'a.jpg' }])).toBe(true);
    expect(sameOptions(options, [{ value: 'a', label: 'A', image: 'b.jpg' }])).toBe(false);
  });
});

describe('question type checks', () => {
  it('explains why a scale needs format 1.3', () => {
    expect(checkDefinition(form([field({})], '1.2'))).toEqual([
      expect.objectContaining({
        code: 'outdated-format-version',
        message:
          '/formatVersion: /fields/0 is a scale, which needs format 1.3. Set "formatVersion": "1.3". Older versions of @formhaus/core treat this type as a custom type and do not validate it. Upgrade the server that runs validateSubmission() first.',
      }),
    ]);
  });

  it('suggests the built-in type for a dashed spelling of it', () => {
    expect(checkDefinition(form([field({ type: 'multi-select' })]))).toEqual([
      expect.objectContaining({ code: 'unknown-field-type', hint: 'Use "multiselect", or register a component for "multi-select".' }),
    ]);
  });

  it('does not suggest a built-in type for a dashed custom type', () => {
    expect(checkDefinition(form([field({ type: 'x-rating' }), field({ key: 'b', type: 'scales' })]))).toEqual([
      expect.objectContaining({
        code: 'unknown-field-type',
        path: '/fields/1/type',
        hint: 'Use "scale", or register a component for "scales".',
      }),
    ]);
  });

  it('lists the option message as a used message for scale and rating', () => {
    const slot = definitionSlots(form([field({ type: 'rating' })])).find((item) => item.address.join('.') === 'messages.option');
    expect(slot?.template).toBe(true);
  });
});
