import type { FormDefinition } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KitTheme } from '../kits/kit';
import { nextFrameX, renderForm } from '../render-form';
import type { FormRenderer } from '../renderers/types';

const definition: FormDefinition = {
  id: 'existing-form',
  title: 'Existing form',
  submit: { label: 'Submit' },
  fields: [{ key: 'name', type: 'text', label: 'Name' }],
};

const font = { family: 'Inter', style: 'Regular' };
const theme: KitTheme = {
  fonts: { regular: font, medium: font, semibold: font },
  text: '#000000',
  muted: '#666666',
  card: { fill: '#FFFFFF', radius: 12, padding: 24, gap: 16, width: 400 },
  actionsGap: 8,
  optionGroup: { gap: 0 },
  titleSize: 24,
  bodySize: 16,
  captionSize: 12,
};

function node(extra: Record<string, unknown> = {}) {
  return {
    name: '', x: 0, width: 400, height: 100, fills: [] as unknown[], children: [] as unknown[],
    resize: vi.fn(), setSharedPluginData: vi.fn(), appendChild: vi.fn(), ...extra,
  };
}

function stubFigma(children: unknown[]) {
  const created: { x: number }[] = [];
  vi.stubGlobal('figma', {
    currentPage: {
      children,
      findAllWithCriteria: ({ types }: { types: string[] }) => (children as { type: string }[]).filter((child) => types.includes(child.type)),
    },
    createText: () => node({ type: 'TEXT' }),
    createFrame: () => {
      const frame = node({ type: 'FRAME' });
      created.push(frame);
      return frame;
    },
  });
  return created;
}

function renderer(field: FormRenderer['field']): FormRenderer {
  return { theme, field, button: async () => null };
}

describe('renderForm', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('places each new step where the matching old step frame was', async () => {
    const stepOne = { type: 'FRAME', x: 0, y: 500, width: 300, absoluteTransform: [[1, 0, 0], [0, 1, 500]], getSharedPluginData: () => definition.id, remove: vi.fn() };
    const stepTwo = { type: 'FRAME', x: 0, y: 1200, width: 300, absoluteTransform: [[1, 0, 0], [0, 1, 1200]], getSharedPluginData: () => definition.id, remove: vi.fn() };
    const created = stubFigma([stepTwo, stepOne]);
    const twoSteps = { ...definition, steps: [{ id: 'a', title: 'A', fields: [] }, { id: 'b', title: 'B', fields: [] }] };
    await renderForm(twoSteps, renderer(async () => node() as unknown as SceneNode));
    const frames = created.filter((frame) => (frame as unknown as { name: string }).name.includes('Step'));
    expect(frames.map((frame) => [frame.x, (frame as unknown as { y: number }).y])).toEqual([[0, 500], [0, 1200]]);
  });

  it('replaces a previous render of the same definition in place', async () => {
    const oldForm = { type: 'FRAME', x: 300, y: 40, width: 300, absoluteTransform: [[1, 0, 300], [0, 1, 40]], getSharedPluginData: () => definition.id, remove: vi.fn() };
    const unrelated = { type: 'FRAME', x: 0, width: 100, absoluteTransform: [[1, 0, 0], [0, 1, 0]], getSharedPluginData: () => 'other-form', remove: vi.fn() };
    const created = stubFigma([unrelated, oldForm]);
    await renderForm(definition, renderer(async () => node() as unknown as SceneNode));
    expect(created[0]).toMatchObject({ x: 300, y: 40 });
    expect(oldForm.remove).toHaveBeenCalled();
    expect(unrelated.remove).not.toHaveBeenCalled();
  });

  it('keeps existing frames when a field fails to render', async () => {
    const remove = vi.fn();
    stubFigma([{ type: 'FRAME', x: 0, width: 0, absoluteTransform: [[1, 0, 0], [0, 1, 0]], getSharedPluginData: () => definition.id, remove }]);
    await expect(renderForm(definition, renderer(async () => { throw new Error('Import failed'); }))).rejects.toThrow('Import failed');
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('nextFrameX', () => {
  it('places the new form past unrelated content', () => {
    expect(nextFrameX([{ x: 0, width: 300 }, { x: 500, width: 200 }], [])).toBe(800);
  });

  it('ignores the frames about to be removed so position stays stable on regeneration', () => {
    const oldForm = { x: 0, width: 300 };
    expect(nextFrameX([oldForm], [oldForm])).toBe(100);
  });
});
