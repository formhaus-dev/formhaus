import { vi } from 'vitest';
import type { KitTheme } from '../kits/kit';
import type { FormRenderer } from '../renderers/types';

const font = { family: 'Inter', style: 'Regular' };
export const TEXT_ADVANCE = 7;

export const theme: KitTheme = {
  fonts: { regular: font, medium: font, semibold: font },
  text: '#000000',
  muted: '#666666',
  accent: '#0000FF',
  control: { height: 40, radius: 8, target: 44 },
  card: { fill: '#FFFFFF', radius: 12, padding: 24, gap: 16, width: 400 },
  actionsGap: 8,
  optionGroup: { gap: 0 },
  titleSize: 24,
  headingSize: 20,
  bodySize: 16,
  captionSize: 12,
};

export function node(extra: Record<string, unknown> = {}) {
  const children: unknown[] = [];
  return {
    name: '',
    x: 0,
    width: 400,
    height: 100,
    fills: [] as unknown[],
    children,
    resize: vi.fn(),
    setSharedPluginData: vi.fn(),
    appendChild: vi.fn((child: unknown) => void children.push(child)),
    findAll: () => [],
    findChild: () => null,
    remove: vi.fn(),
    ...extra,
  };
}

export interface SceneStub {
  name: string;
  type: string;
  characters?: string;
  fills: { color?: { r: number; g: number; b: number } }[];
  children: SceneStub[];
}

export function find(root: SceneStub, name: string): SceneStub | undefined {
  if (root.name === name) return root;
  for (const child of root.children ?? []) {
    const found = find(child, name);
    if (found) return found;
  }
  return undefined;
}

export function texts(root: SceneStub): string[] {
  return [...(root.type === 'TEXT' ? [root.characters ?? ''] : []), ...(root.children ?? []).flatMap(texts)];
}

export function stubFigma(children: unknown[]) {
  const created: { x: number }[] = [];
  vi.stubGlobal('figma', {
    getNodeByIdAsync: async () => null,
    currentPage: {
      children,
      flowStartingPoints: [],
      findAllWithCriteria: ({ types }: { types: string[] }) =>
        (children as { type: string }[]).filter((child) => types.includes(child.type)),
    },
    createText: () => {
      const created = Object.assign(node({ type: 'TEXT' }), { characters: '' });
      Object.defineProperty(created, 'width', { get: () => created.characters.length * TEXT_ADVANCE });
      return created;
    },
    createEllipse: () => node({ type: 'ELLIPSE' }),
    createRectangle: () => node({ type: 'RECTANGLE' }),
    createNodeFromSvg: (svg: string) => node({ type: 'FRAME', svg }),
    createFrame: () => {
      const frame = node({ type: 'FRAME' });
      created.push(frame);
      return frame;
    },
  });
  return created;
}

export function renderer(field: FormRenderer['field']): FormRenderer {
  return { theme, field, button: async () => null, glyph: (kind) => node({ type: 'ELLIPSE', name: kind }) as unknown as SceneNode };
}
