import type { FormDefinition, FormField } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KitTheme } from '../kits/kit';
import { nextFrameX, renderForm } from '../render-form';
import { itemTitle } from '../render-nodes';
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
  headingSize: 20,
  bodySize: 16,
  captionSize: 12,
};

function node(extra: Record<string, unknown> = {}) {
  return {
    name: '',
    x: 0,
    width: 400,
    height: 100,
    fills: [] as unknown[],
    children: [] as unknown[],
    resize: vi.fn(),
    setSharedPluginData: vi.fn(),
    appendChild: vi.fn(),
    findAll: () => [],
    findChild: () => null,
    ...extra,
  };
}

function stubFigma(children: unknown[]) {
  const created: { x: number }[] = [];
  vi.stubGlobal('figma', {
    getNodeByIdAsync: async () => null,
    currentPage: {
      children,
      flowStartingPoints: [],
      findAllWithCriteria: ({ types }: { types: string[] }) =>
        (children as { type: string }[]).filter((child) => types.includes(child.type)),
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
    const stepOne = {
      type: 'FRAME',
      x: 0,
      y: 500,
      width: 300,
      absoluteTransform: [
        [1, 0, 0],
        [0, 1, 500],
      ],
      getSharedPluginData: (_: string, key: string) => (key === 'definitionId' ? definition.id : ''),
      remove: vi.fn(),
    };
    const stepTwo = {
      type: 'FRAME',
      x: 0,
      y: 1200,
      width: 300,
      absoluteTransform: [
        [1, 0, 0],
        [0, 1, 1200],
      ],
      getSharedPluginData: (_: string, key: string) => (key === 'definitionId' ? definition.id : ''),
      remove: vi.fn(),
    };
    const created = stubFigma([stepTwo, stepOne]);
    const twoSteps = {
      ...definition,
      steps: [
        { id: 'a', title: 'A', fields: [] },
        { id: 'b', title: 'B', fields: [] },
      ],
    };
    await renderForm(
      twoSteps,
      renderer(async () => node() as unknown as SceneNode),
    );
    const frames = created.filter((frame) => (frame as unknown as { name: string }).name.includes('Step'));
    expect(frames.map((frame) => [frame.x, (frame as unknown as { y: number }).y])).toEqual([
      [0, 500],
      [0, 1200],
    ]);
  });

  it('skips hidden fields', async () => {
    stubFigma([]);
    const field = vi.fn(async (_: FormField) => node() as unknown as SceneNode);
    await renderForm(
      { ...definition, fields: [{ key: 'source', type: 'hidden', label: 'Source' }, ...definition.fields!] },
      renderer(field),
    );
    expect(field.mock.calls.map(([rendered]) => rendered.key)).toEqual(['name']);
  });

  it('draws a section frame with its title and fields, and a group with one item and an add button', async () => {
    const created = stubFigma([]);
    const field = vi.fn(async (_: FormField) => node() as unknown as SceneNode);
    const button = vi.fn(async (label: string) => node({ type: 'FRAME', label }) as unknown as SceneNode);
    const nested: FormDefinition = {
      ...definition,
      formatVersion: '1.1',
      fields: [
        {
          key: 'billing',
          type: 'section',
          title: 'Billing',
          description: 'For invoices',
          fields: [{ key: 'street', type: 'text', label: 'Street' }],
        },
        {
          key: 'people',
          type: 'group',
          label: 'People',
          itemLabel: 'Person {index}',
          addLabel: 'Add person',
          fields: [{ key: 'email', type: 'email', label: 'Email' }],
        },
      ],
    };
    await renderForm(nested, { theme, field, button });
    expect(field.mock.calls.map(([rendered]) => rendered.key)).toEqual(['street', 'email']);
    expect(created.map((frame) => (frame as unknown as { name: string }).name)).toEqual(
      expect.arrayContaining(['Section: Billing', 'Group: People', 'Person 1']),
    );
    expect(button).toHaveBeenCalledWith('Add person', 'secondary');
  });

  it('draws defaultItems items', async () => {
    const created = stubFigma([]);
    await renderForm(
      {
        ...definition,
        fields: [{ key: 'crew', type: 'group', label: 'Crew', defaultItems: 2, fields: [{ key: 'name', type: 'text', label: 'Name' }] }],
      },
      renderer(async () => node() as unknown as SceneNode),
    );
    expect(created.map((frame) => (frame as unknown as { name: string }).name)).toEqual(expect.arrayContaining(['Crew 1', 'Crew 2']));
    expect(itemTitle({ key: 'g', type: 'group', label: 'Guest', itemLabel: '{label} #{index}', fields: [] }, 2)).toBe('Guest #3');
  });

  it('replaces a previous render of the same definition in place', async () => {
    const oldForm = {
      type: 'FRAME',
      x: 300,
      y: 40,
      width: 300,
      absoluteTransform: [
        [1, 0, 300],
        [0, 1, 40],
      ],
      getSharedPluginData: (_: string, key: string) => (key === 'definitionId' ? definition.id : ''),
      remove: vi.fn(),
    };
    const unrelated = {
      type: 'FRAME',
      x: 0,
      width: 100,
      absoluteTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      getSharedPluginData: (_: string, key: string) => (key === 'definitionId' ? 'other-form' : ''),
      remove: vi.fn(),
    };
    const created = stubFigma([unrelated, oldForm]);
    await renderForm(
      definition,
      renderer(async () => node() as unknown as SceneNode),
    );
    expect(created[0]).toMatchObject({ x: 300, y: 40 });
    expect(oldForm.remove).toHaveBeenCalled();
    expect(unrelated.remove).not.toHaveBeenCalled();
  });

  it('keeps existing frames when a field fails to render', async () => {
    const remove = vi.fn();
    stubFigma([
      {
        type: 'FRAME',
        x: 0,
        width: 0,
        absoluteTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        getSharedPluginData: (_: string, key: string) => (key === 'definitionId' ? definition.id : ''),
        remove,
      },
    ]);
    await expect(
      renderForm(
        definition,
        renderer(async () => {
          throw new Error('Import failed');
        }),
      ),
    ).rejects.toThrow('Import failed');
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('nextFrameX', () => {
  it('places the new form past unrelated content', () => {
    expect(
      nextFrameX(
        [
          { x: 0, width: 300 },
          { x: 500, width: 200 },
        ],
        [],
      ),
    ).toBe(800);
  });

  it('ignores the frames about to be removed so position stays stable on regeneration', () => {
    const oldForm = { x: 0, width: 300 };
    expect(nextFrameX([oldForm], [oldForm])).toBe(100);
  });
});
