import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applySlots } from '../text-slots';

const font = { family: 'Brand Sans', style: 'Regular' };

function layer(name: string) {
  return { type: 'TEXT', name, visible: true, characters: name, fontName: font, parent: null as unknown, getRangeAllFontNames: () => [font] };
}

function instance(properties: Record<string, { type: string }>, layers: ReturnType<typeof layer>[]) {
  const node = {
    type: 'INSTANCE',
    componentProperties: properties,
    setProperties: vi.fn(),
    findAll: (predicate: (child: unknown) => boolean) => layers.filter(predicate),
    findAllWithCriteria: () => layers,
    findOne: (predicate: (child: unknown) => boolean) => layers.find(predicate) ?? null,
  };
  for (const child of layers) child.parent = node;
  return node;
}

describe('applySlots', () => {
  beforeEach(() => {
    vi.stubGlobal('figma', { mixed: Symbol('mixed'), loadFontAsync: vi.fn().mockResolvedValue(undefined) });
  });

  it('fills text properties by slot and hides an empty helper', async () => {
    const node = instance({ 'Label#1:0': { type: 'TEXT' }, 'Value#1:1': { type: 'TEXT' }, 'Show helper#1:2': { type: 'BOOLEAN' } }, []);
    await applySlots(node as unknown as InstanceNode, { label: 'Email *', value: '', helper: '' });
    expect(node.setProperties).toHaveBeenCalledWith({ 'Label#1:0': 'Email *', 'Value#1:1': ' ', 'Show helper#1:2': false });
  });

  it('falls back to text layer names when the component has no text properties', async () => {
    const header = layer('Header');
    const helper = layer('Helper text');
    await applySlots(instance({}, [header, helper]) as unknown as InstanceNode, { label: 'Name', helper: '' });
    expect(header.characters).toBe('Name');
    expect(helper.visible).toBe(false);
  });

  it('switches layers to Inter when their font is unavailable', async () => {
    vi.stubGlobal('figma', {
      mixed: Symbol('mixed'),
      loadFontAsync: vi.fn((requested: FontName) => (requested.family === 'Inter' ? Promise.resolve() : Promise.reject(new Error('missing')))),
    });
    const header = layer('Header');
    await applySlots(instance({}, [header]) as unknown as InstanceNode, { label: 'Name' });
    expect(header.fontName).toEqual({ family: 'Inter', style: 'Regular' });
    expect(header.characters).toBe('Name');
  });

  it('fills explicitly named layers inside nested instances', async () => {
    const header = layer('Header');
    const node = instance({}, [header]);
    header.parent = { type: 'INSTANCE', parent: node };
    const binding = { source: 'library' as const, key: 'k', text: { label: 'Header' } };
    await applySlots(node as unknown as InstanceNode, { label: 'Email' }, binding);
    expect(header.characters).toBe('Email');
  });
});
