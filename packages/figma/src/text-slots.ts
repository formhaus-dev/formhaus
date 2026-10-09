import type { Binding, TextSlot } from './config';
import { HELPER_VISIBLE_PROPERTY } from './kits/primitives';

export type SlotValues = Partial<Record<TextSlot, string>>;

const SLOT_ORDER: TextSlot[] = ['helper', 'label', 'value'];

const SLOT_PATTERNS: Record<TextSlot, RegExp> = {
  helper: /helper|hint|caption|supporting|description|message/i,
  label: /label|title|header|heading/i,
  value: /value|placeholder|input|text|content/i,
};

export function slotForName(name: string, binding?: Binding): TextSlot | undefined {
  const explicit = SLOT_ORDER.find((slot) => binding?.text?.[slot] === name);
  if (explicit) return explicit;
  if (binding?.text && Object.values(binding.text).length > 0) return undefined;
  return SLOT_ORDER.find((slot) => SLOT_PATTERNS[slot].test(name));
}

export async function applySlots(instance: InstanceNode, values: SlotValues, binding?: Binding): Promise<void> {
  await loadFonts(instance);
  const filled = setTextProperties(instance, values, binding);
  for (const slot of SLOT_ORDER) {
    if (filled.has(slot) || values[slot] === undefined) continue;
    const layer = ownTextLayers(instance).find((node) => slotForName(node.name, binding) === slot);
    if (!layer) continue;
    if (values[slot]) layer.characters = values[slot]!;
    else if (slot === 'helper') layer.visible = false;
  }
}

function setTextProperties(instance: InstanceNode, values: SlotValues, binding?: Binding): Set<TextSlot> {
  const updates: Record<string, string | boolean> = {};
  const filled = new Set<TextSlot>();
  for (const [key, property] of Object.entries(instance.componentProperties)) {
    const name = key.split('#')[0];
    if (property.type === 'BOOLEAN' && name === HELPER_VISIBLE_PROPERTY) updates[key] = Boolean(values.helper);
    if (property.type !== 'TEXT') continue;
    const slot = slotForName(name, binding);
    if (!slot || filled.has(slot) || values[slot] === undefined) continue;
    updates[key] = values[slot] || ' ';
    filled.add(slot);
  }
  if (Object.keys(updates).length > 0) instance.setProperties(updates);
  return filled;
}

function ownTextLayers(instance: InstanceNode): TextNode[] {
  return instance.findAll((node) => node.type === 'TEXT' && node.visible && nearestInstance(node) === instance) as TextNode[];
}

function nearestInstance(node: BaseNode): BaseNode | null {
  let current = node.parent;
  while (current && current.type !== 'INSTANCE') current = current.parent;
  return current;
}

const FALLBACK_FONT: FontName = { family: 'Inter', style: 'Regular' };

async function loadFonts(instance: InstanceNode): Promise<void> {
  const nodesByFont = new Map<string, { font: FontName; nodes: TextNode[] }>();
  for (const node of instance.findAllWithCriteria({ types: ['TEXT'] })) {
    const used = node.characters.length > 0
      ? node.getRangeAllFontNames(0, node.characters.length)
      : node.fontName === figma.mixed ? [] : [node.fontName];
    for (const font of used) {
      const key = `${font.family}/${font.style}`;
      const entry = nodesByFont.get(key) ?? { font, nodes: [] };
      entry.nodes.push(node);
      nodesByFont.set(key, entry);
    }
  }
  const missing = await Promise.all([...nodesByFont.values()].map(async (entry) => {
    try {
      await figma.loadFontAsync(entry.font);
      return [];
    } catch {
      return entry.nodes;
    }
  }));
  const fallbackNodes = missing.flat();
  if (fallbackNodes.length === 0) return;
  await figma.loadFontAsync(FALLBACK_FONT);
  for (const node of fallbackNodes) node.fontName = FALLBACK_FONT;
}
