import { describe, expect, it } from 'vitest';
import { capabilitiesTool } from '../src/capabilities';
import { exampleDefinitionsTool } from '../src/examples';
import { simulatePathTool } from '../src/simulate';
import { validateDefinitionTool } from '../src/validate';

const form = (fields: unknown[]) => ({ id: 'x', formatVersion: '1.3', title: 'X', submit: { label: 'Send' }, fields });
const summary = (fields: unknown[]) =>
  validateDefinitionTool({ definition: form(fields) }).issues.map(({ severity, code, path }) => `${severity} ${code} ${path}`);
const scale = (validation: object, extra: object = {}) => ({ key: 's', type: 'scale', label: 'S', validation, ...extra });
const row = (key: string, labels: string[]) => ({
  key,
  type: 'radio',
  label: key,
  options: labels.map((label) => ({ value: label.toLowerCase(), label })),
});
const matrix = (fields: unknown[]) => ({ key: 'm', type: 'section', layout: 'matrix', title: 'M', fields });

describe('capabilities for question types', () => {
  it('lists scale, rating, anchors, images and the matrix layout', () => {
    const result = capabilitiesTool();
    expect(result.fieldTypes).toEqual(expect.arrayContaining(['scale', 'rating']));
    expect(Object.keys(result.fieldTypeNotes)).toEqual(expect.arrayContaining(['scale', 'rating']));
    expect(result.fieldProps.imageFieldTypes).toEqual(['radio', 'multiselect']);
    expect(result.fieldProps.autoAdvance).toMatch(/^radio, scale, rating only/);
    expect(result.sections.layouts).toEqual(['matrix']);
    expect(result.sections.shape).toMatch(/layout\?/);
  });

  it('returns a survey example without issues', () => {
    const result = exampleDefinitionsTool({ id: 'product-survey' });
    if (!('definition' in result)) throw new Error('missing survey');
    expect(validateDefinitionTool({ definition: result.definition }).issues).toEqual([]);
  });
});

describe('scale lint', () => {
  it('accepts NPS, the default range and a rating minimum', () => {
    const nps = scale(
      { min: 0, max: 10 },
      {
        options: [
          { value: '0', label: 'Low' },
          { value: '10', label: 'High' },
        ],
      },
    );
    expect(summary([nps, { key: 'r', type: 'rating', label: 'R', validation: { min: 2 } }, { ...scale({}), key: 't' }])).toEqual([]);
  });

  it('reports impossible, empty and oversized ranges', () => {
    expect(summary([scale({ min: 2 })])).toEqual(['warning scale-range /fields/0/validation/min']);
    expect(summary([scale({ min: 0.5 })])).toEqual([
      'error invalid-scale /fields/0/validation',
      'warning scale-range /fields/0/validation/min',
    ]);
    expect(summary([scale({ max: 1 })])).toEqual([
      'error invalid-scale /fields/0/validation',
      'warning scale-range /fields/0/validation/max',
    ]);
    expect(summary([scale({ min: 0, max: 12 })])).toEqual([
      'error invalid-scale /fields/0/validation',
      'warning scale-range /fields/0/validation/max',
    ]);
    expect(summary([{ key: 'r', type: 'rating', label: 'R', validation: { max: 12 } }])).toEqual([
      'error invalid-scale /fields/0/validation',
      'warning scale-range /fields/0/validation/max',
    ]);
  });

  it('reports a rating minimum no star reaches', () => {
    expect(summary([{ key: 'r', type: 'rating', label: 'R', validation: { min: 6 } }])).toEqual([
      'warning rating-min /fields/0/validation/min',
    ]);
    expect(summary([{ key: 'r', type: 'rating', label: 'R', validation: { min: 1.5 } }])).toEqual([
      'warning rating-min /fields/0/validation/min',
    ]);
  });

  it('reports anchors outside the range and anchors that are not shown', () => {
    const anchors = ['1', '2', '3', '9'].map((value) => ({ value, label: value }));
    expect(summary([scale({}, { options: anchors })])).toEqual([
      'warning anchor-not-shown /fields/0/options/1/value',
      'warning anchor-out-of-range /fields/0/options/3/value',
    ]);
    expect(summary([{ key: 'r', type: 'rating', label: 'R', options: [{ value: '0', label: 'None' }] }])).toEqual([
      'warning anchor-out-of-range /fields/0/options/0/value',
    ]);
  });

  it('allows autoAdvance on scale and rating but not inside a matrix', () => {
    expect(summary([scale({}, { autoAdvance: true }), { key: 'r', type: 'rating', label: 'R', autoAdvance: true }])).toEqual([]);
    const rows = [{ ...row('a', ['No', 'Yes']), autoAdvance: true }, row('b', ['No', 'Yes'])];
    expect(summary([matrix(rows)])).toEqual(['warning auto-advance-ignored /fields/0/fields/0/autoAdvance']);
  });
});

describe('matrix lint', () => {
  it('accepts rows with the same options', () => {
    expect(summary([matrix([row('a', ['No', 'Yes']), row('b', ['No', 'Yes']), { key: 'h', type: 'hidden' }])])).toEqual([]);
  });

  it('accepts rows that load their options from a provider', () => {
    const remote = (key: string) => ({ key, type: 'radio', label: key, optionsFrom: 'scale' });
    expect(summary([matrix([row('a', ['No', 'Yes']), remote('b')]), { ...matrix([remote('c'), row('d', ['No'])]), key: 'n' }])).toEqual([]);
  });

  it('reports rows whose options differ', () => {
    expect(summary([matrix([row('a', ['No', 'Yes']), row('b', ['No', 'Maybe', 'Yes'])])])).toEqual([
      'warning matrix-options-mismatch /fields/0/fields/1/options',
    ]);
  });

  it('reports rows that are not radio or multiselect', () => {
    expect(summary([matrix([row('a', ['No', 'Yes']), { key: 'b', type: 'text', label: 'B' }])])).toEqual([
      'warning matrix-row-type /fields/0/fields/1/type',
    ]);
  });

  it('reports more than seven columns', () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    expect(summary([matrix([row('a', labels), row('b', labels)])])).toEqual(['warning matrix-too-wide /fields/0/fields/0/options']);
  });
});

describe('image lint', () => {
  it('reports images on select options and scale anchors', () => {
    const image = 'https://example.com/a.png';
    const select = { key: 'a', type: 'select', label: 'A', options: [{ value: 'a', label: 'A', image }] };
    const radio = { key: 'b', type: 'radio', label: 'B', options: [{ value: 'b', label: 'B', image }] };
    expect(summary([select, radio, scale({}, { options: [{ value: '1', label: 'Low', image }] })])).toEqual([
      'warning image-not-applicable /fields/0/options/0/image',
      'warning image-not-applicable /fields/2/options/0/image',
    ]);
  });
});

describe('simulate with scale', () => {
  const definition = exampleDefinitionsTool({ id: 'product-survey' });
  if (!('definition' in definition)) throw new Error('missing survey');

  it('moves past a next: false step once the autoAdvance scale has 0', async () => {
    const result = await simulatePathTool({
      definition: definition.definition,
      answers: { nps: 0, support: 4 },
      actions: ['next', 'next'],
    });
    expect(result.trace?.map(({ moved }) => moved)).toEqual([true, true]);
    expect(result.path?.find(({ id }) => id === 'details')?.visibleFields).toContain('improve');
  });

  it('refuses the scale step until it is answered', async () => {
    const result = await simulatePathTool({ definition: definition.definition, answers: {}, actions: ['next', 'next'] });
    expect(result.trace?.[1].reason).toMatch(/autoAdvance radio, scale or rating/);
  });

  it('hides the follow-up for promoters', async () => {
    const result = await simulatePathTool({ definition: definition.definition, answers: { nps: 9, support: 5 } });
    expect(result.path?.find(({ id }) => id === 'details')?.visibleFields).not.toContain('improve');
    expect(result.wouldSubmit).toBe(true);
    expect(result.submitValues).toEqual({ nps: 9, support: 5 });
  });
});
