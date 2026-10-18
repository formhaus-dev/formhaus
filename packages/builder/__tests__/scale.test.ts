import { describe, expect, it } from 'vitest';
import { addField, anchorsOf, createForm, scalePoints, scaleRange, setAnchor, setScaleRange } from '../src';

describe('scale range and anchors', () => {
  function nps() {
    const form = createForm();
    const score = addField(form, { step: null }, { type: 'scale', label: 'Score' });
    return { form, score };
  }

  it('lists points from the range', () => {
    const { form, score } = nps();
    expect(scalePoints(score)).toEqual([1, 2, 3, 4, 5]);
    setScaleRange(form, score.uid, { min: 0, max: 10 });
    expect(scaleRange(score)).toEqual([0, 10]);
    expect(scalePoints({ type: 'rating', extra: { validation: { min: 3, max: 4 } } })).toEqual([1, 2, 3, 4]);
  });

  it('maps start, middle and end anchors to point options', () => {
    const { form, score } = nps();
    setScaleRange(form, score.uid, { min: 0, max: 10 });
    setAnchor(form, score.uid, 'start', 'Not at all likely');
    setAnchor(form, score.uid, 'middle', 'Maybe');
    setAnchor(form, score.uid, 'end', 'Extremely likely');
    expect(score.extra.options).toEqual([
      { value: '0', label: 'Not at all likely' },
      { value: '5', label: 'Maybe' },
      { value: '10', label: 'Extremely likely' },
    ]);
    expect(anchorsOf(score)).toEqual({ start: 'Not at all likely', middle: 'Maybe', end: 'Extremely likely' });
  });

  it('moves anchors with the range and drops empty ones', () => {
    const { form, score } = nps();
    setAnchor(form, score.uid, 'start', 'Low');
    setAnchor(form, score.uid, 'end', 'High');
    setScaleRange(form, score.uid, { min: 0, max: 6 });
    expect(score.extra.options).toEqual([
      { value: '0', label: 'Low' },
      { value: '6', label: 'High' },
    ]);
    setAnchor(form, score.uid, 'start', '');
    setAnchor(form, score.uid, 'end', '');
    expect(score.extra).toEqual({ validation: { min: 0, max: 6 } });
    setScaleRange(form, score.uid, { min: undefined, max: undefined });
    expect(score.extra).toEqual({});
  });
});
