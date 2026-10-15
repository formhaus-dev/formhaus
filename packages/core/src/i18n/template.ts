import type { FormDefinition } from '../types';
import { translationKey } from './localize';
import { assign, placeholders, type Overlay } from './overlay';
import { definitionSlots, type Slot } from './slots';

export interface TextSlot {
  address: string;
  key?: string;
  text: string;
  params: string[];
  hash: string;
}

export interface TextSlotOptions {
  prefix?: string | false;
}

export function textHash(key: string | undefined, text: string): string {
  let hash = 0x811c9dc5;
  for (const char of `${key ?? ''}\u0000${text}`) hash = Math.imul(hash ^ char.codePointAt(0)!, 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

export const templateSlots = (definition: FormDefinition): Slot[] => definitionSlots(definition).filter((slot) => slot.template);

export function describeSlot(slot: Slot, prefix: string | false): TextSlot {
  const key = translationKey(prefix, slot.key, slot.address);
  const text = slot.source ?? slot.fallback;
  const params = slot.kind === 'rule' ? Object.keys(slot.params) : placeholders(text);
  return { address: slot.address.join('.'), ...(key !== undefined && { key }), text, params, hash: textHash(key, text) };
}

export function textSlots(definition: FormDefinition, { prefix = definition.id }: TextSlotOptions = {}): TextSlot[] {
  return templateSlots(definition).map((slot) => describeSlot(slot, prefix));
}

export function translationTemplate(definition: FormDefinition): Overlay {
  const overlay: Overlay = {};
  for (const slot of templateSlots(definition)) assign(overlay, slot.address, slot.source ?? slot.fallback);
  return overlay;
}
