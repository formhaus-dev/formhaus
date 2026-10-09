import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '../roles';

const build = vi.fn();

vi.mock('../fonts', () => ({ resolveFonts: vi.fn().mockResolvedValue({}) }));
vi.mock('../kits/ios', () => ({ iosKit: {} }));
vi.mock('../kits/material', () => ({
  materialKit: { id: 'material', name: 'Material 3', version: 2, fontFamilies: [], theme: () => ({}), build: (...args: unknown[]) => build(...args) },
}));

const { loadKit } = await import('../kits/registry');

interface FakeNode {
  id: string;
  type: string;
  removed: boolean;
  parent: FakeNode | null;
  x: number;
  y: number;
  width: number;
  height: number;
  children: FakeNode[];
  getSharedPluginData(namespace: string, key: string): string;
  setSharedPluginData(namespace: string, key: string, value: string): void;
  appendChild(child: FakeNode): void;
  resizeWithoutConstraints(): void;
}

function pluginData() {
  const data = new Map<string, string>();
  return {
    getSharedPluginData: (_: string, key: string) => data.get(key) ?? '',
    setSharedPluginData: (_: string, key: string, value: string) => void data.set(key, value),
  };
}

let nextId = 0;
const nodes = new Map<string, FakeNode>();

function fakeNode(type: string): FakeNode {
  const node: FakeNode = {
    id: `${++nextId}:0`, type, removed: false, parent: null, x: 0, y: 0, width: 100, height: 50,
    children: [],
    ...pluginData(),
    appendChild(child) {
      node.children.push(child);
      child.parent = node;
    },
    resizeWithoutConstraints: vi.fn(),
  };
  nodes.set(node.id, node);
  return node;
}

const page = { children: [] as FakeNode[] };

beforeEach(() => {
  nodes.clear();
  page.children = [];
  build.mockReset().mockImplementation(() => {
    const node = fakeNode('COMPONENT');
    node.setSharedPluginData('formhaus', 'kitVersion', '2');
    return node;
  });
  vi.stubGlobal('figma', {
    root: pluginData(),
    currentPage: page,
    getNodeByIdAsync: async (id: string) => nodes.get(id) ?? null,
    createSection: () => {
      const section = fakeNode('SECTION');
      page.children.push(section);
      return section;
    },
  });
});

describe('loadKit', () => {
  it('builds every role into one section and reuses them on the next load', async () => {
    const first = await loadKit('material');
    expect(build).toHaveBeenCalledTimes(ROLES.length);
    expect(page.children).toHaveLength(1);
    expect(page.children[0].children).toHaveLength(ROLES.length);

    build.mockClear();
    const second = await loadKit('material');
    expect(build).not.toHaveBeenCalled();
    expect(second.components.get('field.text')).toBe(first.components.get('field.text'));
  });

  it('rebuilds a detached component into the existing section', async () => {
    const first = await loadKit('material');
    const section = page.children[0];
    const date = first.components.get('field.date') as unknown as FakeNode;
    section.children.splice(section.children.indexOf(date), 1);
    date.parent = null;

    build.mockClear();
    const second = await loadKit('material');
    expect(build).toHaveBeenCalledTimes(1);
    expect(page.children).toHaveLength(1);
    expect((second.components.get('field.date') as unknown as FakeNode).parent).toBe(section);
  });

  it('rebuilds components from an older kit version', async () => {
    const first = await loadKit('material');
    (first.components.get('field.text') as unknown as FakeNode).setSharedPluginData('formhaus', 'kitVersion', '1');

    build.mockClear();
    await loadKit('material');
    expect(build).toHaveBeenCalledTimes(1);
  });
});
