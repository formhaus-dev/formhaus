import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindingRows } from '../bindings/rows';
import { selectionPreview } from '../bindings/selection-preview';
import { defaultConfig } from '../config';
import { droppedRole } from '../drop';

const png = new Uint8Array([1, 2, 3]);

function component(id: string, name: string) {
  return {
    id, name, type: 'COMPONENT', key: `key-${id}`, remote: false, removed: false, parent: { type: 'PAGE' },
    exportAsync: vi.fn().mockResolvedValue(png),
    findAll: () => [],
    componentPropertyDefinitions: {},
  };
}

const nodes = new Map<string, ReturnType<typeof component>>();

beforeEach(() => {
  nodes.clear();
  vi.stubGlobal('figma', { getNodeByIdAsync: async (id: string) => nodes.get(id) ?? null });
});

describe('bindingRows', () => {
  it('shows the related bound component for an unbound role and the kit preview otherwise', async () => {
    nodes.set('1:1', component('1:1', 'Text field'));
    nodes.set('9:9', component('9:9', 'field.switch'));
    const config = defaultConfig('custom');
    config.bindings['field.text'] = { source: 'local', id: '1:1', name: 'Text field' };
    config.kitNodes.material = { 'field.switch': '9:9' };
    const rows = await bindingRows(config);
    expect(rows.find((row) => row.role === 'field.textarea')).toEqual({ role: 'field.textarea', via: 'field.text', name: 'Text field', thumbnail: png });
    expect(rows.find((row) => row.role === 'field.switch')).toEqual({ role: 'field.switch', thumbnail: png });
    expect(rows.find((row) => row.role === 'option.radio')).toEqual({ role: 'option.radio', thumbnail: undefined });
  });
});

describe('selectionPreview', () => {
  it('suggests a role from the selected component name', async () => {
    const node = component('2:2', 'Dropdown');
    expect(await selectionPreview([node as unknown as SceneNode])).toEqual({ name: 'Dropdown', role: 'field.select', thumbnail: png });
  });

  it('ignores anything that is not a single component', async () => {
    expect(await selectionPreview([])).toBeNull();
    expect(await selectionPreview([{ type: 'FRAME' } as unknown as SceneNode])).toBeNull();
  });
});

describe('droppedRole', () => {
  it('accepts only known roles from drop metadata', () => {
    expect(droppedRole({ dropMetadata: { role: 'button.primary' } } as unknown as DropEvent)).toBe('button.primary');
    expect(droppedRole({ dropMetadata: { role: 'constructor' } } as unknown as DropEvent)).toBeUndefined();
    expect(droppedRole({} as DropEvent)).toBeUndefined();
  });
});
