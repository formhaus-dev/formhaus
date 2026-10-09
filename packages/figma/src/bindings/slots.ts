import type { Binding, TextSlot } from '../config';
import { liveBinding, slotForName, slotNames } from '../text-slots';

export type SlotMap = Partial<Record<TextSlot, string>>;

export interface SlotInfo {
  candidates: string[];
  slots: SlotMap;
}

export function describeSlots(component: ComponentNode, binding?: Binding): SlotInfo {
  const candidates = slotNames(component);
  const live = liveBinding(binding, candidates);
  const slots: SlotMap = {};
  for (const name of candidates) {
    const slot = slotForName(name, live);
    if (slot && !slots[slot]) slots[slot] = name;
  }
  return { candidates, slots };
}

export function assignSlot(current: SlotMap, slot: TextSlot, name: string): SlotMap {
  const next: SlotMap = {};
  for (const [key, value] of Object.entries(current) as [TextSlot, string][]) {
    if (key !== slot && (value === '' || value !== name)) next[key] = value;
  }
  next[slot] = name;
  return next;
}
