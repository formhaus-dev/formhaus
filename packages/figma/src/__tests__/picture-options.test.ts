import type { FormField } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pictureOptions } from '../renderers/picture-options';
import { find, node, type SceneStub, stubFigma, theme } from './render-fixtures';

const options = ['Basic', 'Plus', 'Pro'].map((label) => ({ value: label.toLowerCase(), label, image: `https://example.com/${label}.png` }));

async function render(field: FormField): Promise<{ root: SceneStub; labels: string[] }> {
  const labels: string[] = [];
  const instance = async (_: string, values: { label: string }) => {
    labels.push(values.label);
    return node({ type: 'INSTANCE', findOne: () => null }) as unknown as InstanceNode;
  };
  const root = await pictureOptions(field, 'option.radio', theme, instance);
  return { root: root as unknown as SceneStub, labels };
}

function rows(root: SceneStub): string[][] {
  return (find(root, 'Options')?.children ?? []).map((row) => row.children.map((card) => card.name));
}

describe('pictureOptions', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    stubFigma([]);
  });

  it('lays out cards two per row by default with a spacer in the last row', async () => {
    const { root, labels } = await render({ key: 'plan', type: 'radio', label: 'Plan', options });
    expect(root.name).toBe('plan');
    expect(find(root, 'Label')?.characters).toBe('Plan');
    expect(rows(root)).toEqual([
      ['basic', 'plus'],
      ['pro', 'Spacer'],
    ]);
    expect(labels).toEqual(['Basic', 'Plus', 'Pro']);
  });

  it('draws randomized options in written order', async () => {
    const pinned = options.map((option, index) => ({ ...option, pinned: index === 2 }));
    const { labels } = await render({ key: 'plan', type: 'radio', label: 'Plan', randomize: true, options: pinned });
    expect(labels).toEqual(['Basic', 'Plus', 'Pro']);
  });

  it('follows columns from 1 to 4', async () => {
    const three = await render({ key: 'plan', type: 'multiselect', label: 'Plan', options, columns: 3 });
    expect(rows(three.root)).toEqual([['basic', 'plus', 'pro']]);
    const capped = await render({ key: 'plan', type: 'radio', label: 'Plan', options, columns: 9 });
    expect(rows(capped.root)).toEqual([['basic', 'plus', 'pro', 'Spacer']]);
  });

  it('draws a placeholder image above the option in every card', async () => {
    const { root } = await render({ key: 'plan', type: 'radio', label: 'Plan', options });
    const card = find(root, 'basic')!;
    expect(card.children.map((child) => child.name)).toEqual(['Image', 'basic']);
    expect(find(card, 'Image')?.children.map((child) => child.name)).toEqual(['Icon/image']);
  });

  it('keeps cards without an image the same height with an empty placeholder', async () => {
    const { root } = await render({
      key: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [options[0], { value: 'none', label: 'None' }],
    });
    expect(find(find(root, 'none')!, 'Image')?.children).toEqual([]);
  });
});
