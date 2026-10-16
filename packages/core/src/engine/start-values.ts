import type { FormField, FormGroup } from '../types';
import { hasOwn, isEntry, isGroup, itemId, itemsOf } from '../visibility/nodes';
import { createValues } from './engine-utils';

type Values = Record<string, unknown>;

export function createStartValues(groups: FormGroup[]) {
  let seeds: Values = {};
  let remembering = true;
  const memory = new Map<string, unknown>();
  const itemSeeds = new Map<string, Values>();
  const itemMemory = new Map<string, Values>();
  const seedItems = (value: unknown) => {
    for (const item of itemsOf(value)) if (isEntry(item)) itemSeeds.set(itemId(item, 0), item);
  };

  return {
    seedItems,

    seed(values: Values): void {
      seeds = { ...seeds, ...values };
    },

    resetStarts(values: Values): void {
      seeds = { ...values };
      memory.clear();
      itemMemory.clear();
      itemSeeds.clear();
      for (const group of groups) seedItems(values[group.key]);
    },

    loadPayload(): void {
      remembering = false;
      itemSeeds.clear();
      itemMemory.clear();
      for (const key of Object.keys(seeds)) memory.set(key, undefined);
    },

    remember(key: string, value: unknown): void {
      if (remembering) memory.set(key, value);
    },

    rememberItem(item: unknown, key: string, value: unknown): void {
      if (!remembering || !isEntry(item)) return;
      const id = itemId(item, 0);
      itemMemory.set(id, { ...itemMemory.get(id), [key]: value });
    },

    dropItem(item: unknown): void {
      if (!isEntry(item)) return;
      itemSeeds.delete(itemId(item, 0));
      itemMemory.delete(itemId(item, 0));
    },

    reseed(keys: string[], values: Values): () => void {
      const previous = keys.map((key) => [key, seeds[key], memory.has(key), memory.get(key)] as const);
      for (const key of keys) {
        memory.delete(key);
        seeds[key] = values[key];
        seedItems(values[key]);
      }
      return () => {
        for (const [key, seed, remembered, value] of previous) {
          seeds[key] = seed;
          if (remembered) memory.set(key, value);
          else memory.delete(key);
        }
      };
    },

    startValue(field: FormField): unknown {
      const { key } = field;
      const remembered = field.type !== 'hidden' && memory.has(key);
      const value = remembered ? memory.get(key) : seeds[key];
      if (value !== undefined) return value;
      return isGroup(field) && field.defaultItems! > 0 && hasOwn(seeds, key) ? createValues([field])[key] : undefined;
    },

    itemStartValue(item: unknown, key: string): unknown {
      if (!isEntry(item)) return undefined;
      const remembered = itemMemory.get(itemId(item, 0));
      return remembered && hasOwn(remembered, key) ? remembered[key] : itemSeeds.get(itemId(item, 0))?.[key];
    },
  };
}
