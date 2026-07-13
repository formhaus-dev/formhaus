import type { FormDefinition } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextFrameX, renderForm } from '../render-form';

const definition: FormDefinition = {
  id: 'existing-form',
  title: 'Existing form',
  submit: { label: 'Submit' },
  fields: [{ key: 'name', type: 'text', label: 'Name' }],
};

describe('renderForm', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('positions a regenerated form over the old one, past unrelated content only', async () => {
    const emptyDefinition: FormDefinition = {
      id: 'regen-form',
      title: 'Regen form',
      submit: { label: 'Submit' },
      fields: [],
    };
    const oldForm = {
      type: 'FRAME',
      x: 300,
      width: 300,
      getSharedPluginData: () => emptyDefinition.id,
      remove: vi.fn(),
    };
    const unrelated = {
      type: 'FRAME',
      x: 0,
      width: 100,
      getSharedPluginData: () => 'other-form',
      remove: vi.fn(),
    };
    const created: { x: number }[] = [];
    vi.stubGlobal('figma', {
      currentPage: { children: [unrelated, oldForm] },
      importComponentSetByKeyAsync: vi.fn().mockResolvedValue({ children: [] }),
      loadFontAsync: vi.fn().mockResolvedValue(undefined),
      createText: () => ({ fontName: null, fontSize: 0, characters: '', fills: [], layoutSizingHorizontal: '' }),
      createFrame: () => {
        const frame = {
          name: '', layoutMode: '', primaryAxisSizingMode: '', counterAxisSizingMode: '',
          itemSpacing: 0, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
          fills: [] as unknown[], cornerRadius: 0, x: 0, width: 0, layoutSizingHorizontal: '',
          resize: vi.fn(), setSharedPluginData: vi.fn(), appendChild: vi.fn(),
        };
        created.push(frame);
        return frame;
      },
    });

    await renderForm(emptyDefinition);

    // Excludes the old form (right edge 600); lands just past unrelated content (right edge 100).
    // The pre-fix code counted the old form and would place it at 700.
    expect(created[0].x).toBe(200);
    expect(oldForm.remove).toHaveBeenCalled();
  });

  it('keeps existing frames when component imports fail', async () => {
    const remove = vi.fn();
    const existingFrame = {
      type: 'FRAME',
      getSharedPluginData: () => definition.id,
      remove,
    };
    vi.stubGlobal('figma', {
      currentPage: { children: [existingFrame] },
      importComponentSetByKeyAsync: vi.fn().mockRejectedValue(new Error('Import failed')),
      loadFontAsync: vi.fn().mockResolvedValue(undefined),
    });

    await expect(renderForm(definition)).rejects.toThrow('Import failed');

    expect(remove).not.toHaveBeenCalled();
  });
});

describe('nextFrameX', () => {
  it('places the new form past unrelated content', () => {
    const children = [{ x: 0, width: 300 }, { x: 500, width: 200 }];
    expect(nextFrameX(children, [])).toBe(800);
  });

  it('ignores the frames about to be removed so position stays stable on regeneration', () => {
    const oldForm = { x: 0, width: 300 };
    const children = [oldForm];
    expect(nextFrameX(children, [oldForm])).toBe(100);
  });
});
