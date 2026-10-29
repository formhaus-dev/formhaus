import { hasOwn, isEntry } from '../visibility/nodes';
import type { FormDefinition } from '../types';
import { textNodes } from './walk';
import { addresses, addressKey, leaves, lookup, placeholders } from './overlay';
import { definitionSlots, type Slot } from './slots';
import { describeSlot } from './template';
import { PLURALS } from './locale';

export interface TranslationMeta {
  prefix?: string | false;
  slots?: Record<string, { hash?: string }>;
}

export interface TranslationIssues {
  missing: string[];
  unknown: string[];
  invalid: string[];
  placeholderMismatch: string[];
  unlabeled: string[];
  stale?: string[];
}

const dotted = (path: string[]) => path.join('.');

const catalogEntry = ([part, key, form, ...rest]: string[], known: Set<string>) =>
  (part === 'locale' && key === undefined) ||
  ((part === 'messages' || part === 'labels') && PLURALS.includes(form) && !rest.length && known.has(addressKey([part, key])));

function plural(overlay: unknown, slot: Slot): boolean {
  const [part, key] = slot.address;
  const block = slot.kind !== 'text' && slot.kind !== 'rule' && isEntry(overlay) && overlay[part];
  const text = isEntry(block) && block[key];
  return isEntry(text) && typeof text.other === 'string';
}

function mismatch(slot: Slot, text: string): boolean {
  const used = placeholders(text);
  if (slot.kind === 'rule') return used.some((name) => !hasOwn(slot.params, name));
  return used.join() !== placeholders(slot.source ?? slot.fallback).join();
}

export function translationIssues(definition: FormDefinition, overlay: unknown, meta?: TranslationMeta): TranslationIssues {
  const slots = definitionSlots(definition);
  const known = new Set(slots.flatMap((slot) => addresses(slot.address).map(addressKey)));
  const found = isEntry(overlay) ? leaves(overlay).filter(({ path }) => !catalogEntry(path, known)) : [{ path: [], value: null }];
  const translated = slots.filter((slot) => lookup(overlay, slot.address) !== undefined);
  const result: TranslationIssues = {
    missing: slots
      .filter((slot) => slot.template && lookup(overlay, slot.address) === undefined && !plural(overlay, slot))
      .map((slot) => dotted(slot.address)),
    unknown: found.filter(({ path, value }) => typeof value === 'string' && !known.has(addressKey(path))).map(({ path }) => dotted(path)),
    invalid: found.filter(({ value }) => typeof value !== 'string').map(({ path }) => dotted(path)),
    placeholderMismatch: translated.filter((slot) => mismatch(slot, lookup(overlay, slot.address)!)).map((slot) => dotted(slot.address)),
    unlabeled: textNodes(definition)
      .filter(
        ({ kind, node, address }) =>
          (kind === 'field' || kind === 'group') &&
          node.type !== 'hidden' &&
          !(typeof node.label === 'string' && node.label.trim()) &&
          lookup(overlay, [...address, 'label']) === undefined,
      )
      .map(({ address }) => dotted([...address, 'label'])),
  };
  if (meta?.slots) {
    const baseline = meta.slots;
    const own = (address: string) => hasOwn(baseline, address);
    result.stale = translated
      .filter((slot) => slot.template)
      .map((slot) => describeSlot(slot, meta.prefix ?? definition.id))
      .filter(({ address, hash }) => own(address) && baseline[address]?.hash !== undefined && baseline[address].hash !== hash)
      .map(({ address }) => address);
  }
  return result;
}
