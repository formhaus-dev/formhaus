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
    currentPage: { children },
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

  it('replaces a previous render of the same definition in place', async () => {
    const oldForm = { type: 'FRAME', x: 300, width: 300, getSharedPluginData: () => definition.id, remove: vi.fn() };
    const unrelated = { type: 'FRAME', x: 0, width: 100, getSharedPluginData: () => 'other-form', remove: vi.fn() };
    const created = stubFigma([unrelated, oldForm]);
    await renderForm(definition, renderer(async () => node() as unknown as SceneNode));
    expect(created[0].x).toBe(200);
    expect(oldForm.remove).toHaveBeenCalled();
    expect(unrelated.remove).not.toHaveBeenCalled();
  });

  it('keeps existing frames when a field fails to render', async () => {
    const remove = vi.fn();
    stubFigma([{ type: 'FRAME', x: 0, width: 0, getSharedPluginData: () => definition.id, remove }]);
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
