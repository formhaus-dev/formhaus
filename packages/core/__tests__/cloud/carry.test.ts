import { describe, expect, it } from 'vitest';
import { carryValues } from '../../src/cloud/carry';
import type { FormDefinition } from '../../src';

describe('scale and rating', () => {
  const anchors = [
    { value: '1', label: 'Low' },
    { value: '5', label: 'High' },
  ];
  const scales = (fields: FormDefinition['fields']): FormDefinition => ({
    id: 'survey',
    title: 'Survey',
    submit: { label: 'Send' },
    fields,
  });

  it('keeps answers when the definition is unchanged', () => {
    const definition = scales([
      { key: 'score', type: 'scale', label: 'Score' },
      { key: 'stars', type: 'rating', label: 'Stars' },
    ]);
    expect(carryValues({ score: 4, stars: 4 }, definition, definition)).toEqual({ score: 4, stars: 4 });
  });

  it('drops answers outside a changed range', () => {
    const before = scales([
      { key: 'low', type: 'scale', label: 'Low', validation: { min: 1, max: 7 } },
      { key: 'high', type: 'scale', label: 'High', validation: { min: 1, max: 7 } },
    ]);
    const after = scales([
      { key: 'low', type: 'scale', label: 'Low', validation: { min: 2, max: 5 } },
      { key: 'high', type: 'scale', label: 'High', validation: { min: 2, max: 5 } },
    ]);
    expect(carryValues({ low: 1, high: 6 }, after, before)).toEqual({});
    expect(carryValues({ low: 2, high: 5 }, after, before)).toEqual({ low: 2, high: 5 });
  });

  it('keeps answers between endpoint-only anchors', () => {
    const definition = scales([{ key: 'anchored', type: 'scale', label: 'Anchored', validation: { min: 1, max: 5 }, options: anchors }]);
    expect(carryValues({ anchored: 3 }, definition, definition)).toEqual({ anchored: 3 });
  });

  it('checks rating against its stars', () => {
    const before = scales([{ key: 'stars', type: 'rating', label: 'Stars', validation: { max: 5 }, options: anchors }]);
    const after = scales([{ key: 'stars', type: 'rating', label: 'Stars', validation: { max: 3 } }]);
    expect(carryValues({ stars: 4 }, before, before)).toEqual({ stars: 4 });
    expect(carryValues({ stars: 4 }, after, before)).toEqual({});
    expect(carryValues({ stars: 0 }, before, before)).toEqual({});
  });

  it('keeps an NPS answer from 0 to 10', () => {
    const definition = scales([
      {
        key: 'nps',
        type: 'scale',
        label: 'NPS',
        validation: { min: 0, max: 10 },
        options: [
          { value: '0', label: 'Not likely' },
          { value: '10', label: 'Very likely' },
        ],
      },
    ]);
    expect(carryValues({ nps: 0 }, definition, definition)).toEqual({ nps: 0 });
    expect(carryValues({ nps: 7 }, definition, definition)).toEqual({ nps: 7 });
    expect(carryValues({ nps: 7.5 }, definition, definition)).toEqual({});
    expect(carryValues({ nps: '7' }, definition, definition)).toEqual({});
  });
});
