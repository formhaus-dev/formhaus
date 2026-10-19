import type { FormField } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hex } from '../kits/primitives';
import { scaleField } from '../renderers/scale';
import { find, type SceneStub, stubFigma, texts, theme } from './render-fixtures';

function render(field: FormField): SceneStub {
  return scaleField(field, theme) as unknown as SceneStub;
}

function names(node: SceneStub | undefined): string[] {
  return (node?.children ?? []).map((child) => child.name);
}

describe('scaleField', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    stubFigma([]);
  });

  it('draws a box per point from 1 to 5 by default', () => {
    const root = render({ key: 'ease', type: 'scale', label: 'How easy was it?' });
    expect(root.name).toBe('ease');
    expect(find(root, 'Label')?.characters).toBe('How easy was it?');
    expect(names(find(root, 'Points'))).toEqual(['1', '2', '3', '4', '5']);
    expect(find(root, 'Anchors')).toBeUndefined();
  });

  it('draws an NPS question as 11 points from 0 to 10 with start and end anchors', () => {
    const root = render({
      key: 'score',
      type: 'scale',
      label: 'How likely are you to recommend us?',
      validation: { required: true, min: 0, max: 10 },
      options: [
        { value: '0', label: 'Not at all likely' },
        { value: '10', label: 'Extremely likely' },
      ],
    });
    expect(find(root, 'Label')?.characters).toBe('How likely are you to recommend us? *');
    expect(names(find(root, 'Points'))).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(find(root, 'Start')?.characters).toBe('Not at all likely');
    expect(find(root, 'End')?.characters).toBe('Extremely likely');
    expect(find(root, 'Middle')).toBeUndefined();
  });

  it('shows the middle anchor and marks the default point with the accent', () => {
    const root = render({
      key: 'effort',
      type: 'scale',
      label: 'Effort',
      helperText: 'Pick one',
      defaultValue: 3,
      options: [{ value: '3', label: 'Neutral' }],
    });
    expect(find(root, 'Helper')?.characters).toBe('Pick one');
    expect(find(root, 'Middle')?.characters).toBe('Neutral');
    expect(find(root, '3')?.fills[0].color).toEqual(hex(theme.accent));
    expect(find(root, '2')?.fills[0]?.color).not.toEqual(hex(theme.accent));
  });

  it('draws a rating as stars from 1 to max and fills them up to the default value', () => {
    const root = render({ key: 'stars', type: 'rating', label: 'Rate us', defaultValue: 2, validation: { min: 3, max: 4 } });
    const stars = find(root, 'Stars');
    expect(names(stars)).toEqual(['1', '2', '3', '4']);
    const svgs = (stars?.children ?? []).map((star) => (star as unknown as { svg: string }).svg);
    expect(svgs.slice(0, 2).every((svg) => svg.includes(theme.accent))).toBe(true);
    expect(svgs.slice(2).every((svg) => svg.includes(theme.muted))).toBe(true);
    expect(texts(stars!)).toEqual([]);
  });

  it('caps a scale at 11 points', () => {
    const root = render({ key: 'wide', type: 'scale', label: 'Wide', validation: { min: 0, max: 40 } });
    expect(names(find(root, 'Points'))).toHaveLength(11);
  });
});
