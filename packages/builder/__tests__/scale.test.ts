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

describe('typing a range', () => {
  function rated() {
    const form = createForm();
    const score = addField(form, { step: null }, { type: 'scale', label: 'Score' });
    setAnchor(form, score.uid, 'start', 'Low');
    setAnchor(form, score.uid, 'middle', 'Okay');
    setAnchor(form, score.uid, 'end', 'High');
    return { form, score };
  }

  it('keeps each anchor on its role while "10" is typed into a 1 to 5 scale', () => {
    const { form, score } = rated();
    setScaleRange(form, score.uid, { max: 1 });
    expect(score.extra.options).toHaveLength(3);
    setScaleRange(form, score.uid, { max: 10 });
    expect(score.extra.options).toEqual([
      { value: '1', label: 'Low' },
      { value: '5', label: 'Okay' },
      { value: '10', label: 'High' },
    ]);
    expect(anchorsOf(score)).toEqual({ start: 'Low', middle: 'Okay', end: 'High' });
  });

  it('never puts two anchors on one point', () => {
    const { form, score } = rated();
    for (const max of [2, 3, 1, 4, 6, 9, 11]) setScaleRange(form, score.uid, { max });
    const values = (score.extra.options ?? []).map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
    expect(anchorsOf(score)).toEqual({ start: 'Low', middle: 'Okay', end: 'High' });
  });

  it('keeps labels on points that are not anchors', () => {
    const form = createForm();
    const score = addField(form, { step: null }, { type: 'scale', label: 'Score' });
    score.extra.options = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'].map((label, index) => ({ value: String(index + 1), label }));
    setAnchor(form, score.uid, 'start', 'Not once');
    expect(score.extra.options.map((option) => option.label)).toEqual(['Not once', 'Rarely', 'Sometimes', 'Often', 'Always']);
    setScaleRange(form, score.uid, { min: 1, max: 7 });
    expect(score.extra.options.map((option) => option.label)).toEqual(['Not once', 'Rarely', 'Sometimes', 'Often', 'Always']);
    setScaleRange(form, score.uid, { max: 3 });
    expect(score.extra.options.map((option) => option.label)).toEqual(['Not once', 'Rarely', 'Sometimes']);
  });
});

it('keeps a lone end anchor at the end after an invalid step', () => {
  const form = createForm();
  const score = addField(form, { step: null }, { type: 'scale', label: 'Score' });
  setAnchor(form, score.uid, 'end', 'High');
  setScaleRange(form, score.uid, { max: 1 });
  setScaleRange(form, score.uid, { max: 10 });
  expect(score.extra.options).toEqual([{ value: '10', label: 'High' }]);
});
