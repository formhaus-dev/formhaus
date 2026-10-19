import type { FormField } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hex } from '../kits/primitives';
import { fitColumns, ratingColumns, scaleColumns, scaleField } from '../renderers/scale';
import { find, type SceneStub, stubFigma, texts, theme } from './render-fixtures';

function render(field: FormField): SceneStub {
  return scaleField(field, theme) as unknown as SceneStub;
}

function rows(root: SceneStub, name: string): string[][] {
  return (find(root, name)?.children ?? []).map((row) => row.children.map((cell) => cell.name));
}

function cells(root: SceneStub, name: string): string[] {
  return rows(root, name)
    .flat()
    .filter((cell) => cell !== 'Spacer');
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
    expect(rows(root, 'Points')).toEqual([['1', '2', '3', '4', '5']]);
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
    expect(rows(root, 'Points')).toEqual([
      ['0', '1', '2', '3', '4', '5'],
      ['6', '7', '8', '9', '10', 'Spacer'],
    ]);
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
    expect(cells(root, 'Stars')).toEqual(['1', '2', '3', '4']);
    const svgs = (stars?.children ?? []).flatMap((row) => row.children.map((cell) => (cell.children[0] as unknown as { svg: string }).svg));
    expect(svgs.slice(0, 2).every((svg) => svg.includes(theme.accent))).toBe(true);
    expect(svgs.slice(2).every((svg) => svg.includes(theme.muted))).toBe(true);
    expect(texts(stars!)).toEqual([]);
  });

  it('caps a scale at 11 points', () => {
    const root = render({ key: 'wide', type: 'scale', label: 'Wide', validation: { min: 0, max: 40 } });
    expect(cells(root, 'Points')).toHaveLength(11);
  });

  it('wraps 10 stars into rows of 5 on a narrow card', () => {
    const root = render({ key: 'stars', type: 'rating', label: 'Rate us', validation: { max: 10 } });
    expect(rows(root, 'Stars').map((row) => row.length)).toEqual([5, 5]);
  });
});

describe('scale columns', () => {
  it('follows the web breakpoints for 8 to 11 points under 444px', () => {
    expect([5, 7, 8, 9, 10, 11].map((count) => scaleColumns(count, 352, 44))).toEqual([5, 7, 4, 5, 5, 6]);
  });

  it('wraps 10 and 11 points under 544px and keeps one row above it', () => {
    expect([8, 9, 10, 11].map((count) => scaleColumns(count, 500, 44))).toEqual([8, 9, 5, 6]);
    expect(scaleColumns(11, 600, 44)).toBe(11);
  });

  it('never makes a cell narrower than the touch target', () => {
    expect(scaleColumns(7, 330, 48)).toBe(4);
    expect(scaleColumns(11, 300, 48)).toBe(4);
    expect(fitColumns(5, 5, 100, 48, 6)).toBe(1);
  });

  it('wraps 9 or more stars into rows of 5 under 440px', () => {
    expect([5, 8, 9, 11].map((count) => ratingColumns(count, 352, 48))).toEqual([5, 4, 5, 5]);
    expect(ratingColumns(10, 600, 48)).toBe(10);
  });
});
