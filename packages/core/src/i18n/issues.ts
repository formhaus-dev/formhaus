import type { FormDefinition } from '../types';
import { textNodes } from './walk';
import { addressKey, isEntry, leaves, lookup, placeholders } from './overlay';
import { definitionSlots, type Slot } from './slots';
import { describeSlot } from './template';

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

function mismatch(slot: Slot, text: string): boolean {
  const used = placeholders(text);
  if (slot.kind === 'rule') return used.some((name) => !Object.prototype.hasOwnProperty.call(slot.params, name));
  return used.join() !== placeholders(slot.source ?? slot.fallback).join();
}

export function translationIssues(definition: FormDefinition, overlay: unknown, meta?: TranslationMeta): TranslationIssues {
  const slots = definitionSlots(definition);
  const known = new Set(slots.map((slot) => addressKey(slot.address)));
  const found = isEntry(overlay) ? leaves(overlay) : [{ path: [], value: null }];
  const translated = slots.filter((slot) => lookup(overlay, slot.address) !== undefined);
  const result: TranslationIssues = {
    missing: slots.filter((slot) => slot.template && lookup(overlay, slot.address) === undefined).map((slot) => dotted(slot.address)),
    unknown: found.filter(({ path, value }) => typeof value === 'string' && !known.has(addressKey(path))).map(({ path }) => dotted(path)),
    invalid: found.filter(({ value }) => typeof value !== 'string').map(({ path }) => dotted(path)),
    placeholderMismatch: translated.filter((slot) => mismatch(slot, lookup(overlay, slot.address)!)).map((slot) => dotted(slot.address)),
    unlabeled: textNodes(definition)
      .filter(
        ({ kind, node, address }) =>
          kind === 'field' &&
          !(typeof node.label === 'string' && node.label.trim()) &&
          lookup(overlay, [...address, 'label']) === undefined,
      )
      .map(({ address }) => dotted([...address, 'label'])),
  };
  if (meta?.slots) {
    const baseline = meta.slots;
    const own = (address: string) => Object.prototype.hasOwnProperty.call(baseline, address);
    result.stale = translated
      .filter((slot) => slot.template)
      .map((slot) => describeSlot(slot, meta.prefix ?? definition.id))
      .filter(({ address, hash }) => own(address) && baseline[address]?.hash !== undefined && baseline[address].hash !== hash)
      .map(({ address }) => address);
  }
  return result;
}
