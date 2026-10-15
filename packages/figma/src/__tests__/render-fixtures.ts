import { vi } from 'vitest';
import type { KitTheme } from '../kits/kit';
import type { FormRenderer } from '../renderers/types';

const font = { family: 'Inter', style: 'Regular' };
export const theme: KitTheme = {
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

export function node(extra: Record<string, unknown> = {}) {
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
    createText: () => node({ type: 'TEXT' }),
    createFrame: () => {
      const frame = node({ type: 'FRAME' });
      created.push(frame);
      return frame;
    },
  });
  return created;
}

export function renderer(field: FormRenderer['field']): FormRenderer {
  return { theme, field, button: async () => null };
}
