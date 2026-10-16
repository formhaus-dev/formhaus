import type { FormField, FormGroup } from '../types';
import { hasOwn, isEntry, itemKey, itemsOf } from '../visibility/nodes';

type Values = Record<string, unknown>;

export function createStartValues(groups: FormGroup[], changed: () => void = () => {}) {
  let seeds: Values = {};
  let remembering = true;
  let writes: Set<string> | undefined;
  const memory = new Map<string, unknown>();
  let itemSeeds = new WeakMap<object, Values>();
  let itemMemory = new WeakMap<object, Values>();
  const forgetItems = () => {
    itemSeeds = new WeakMap();
    itemMemory = new WeakMap();
  };
  const seedItems = (value: unknown) => {
    for (const item of itemsOf(value)) if (isEntry(item)) itemSeeds.set(itemKey(item), item);
  };

  return {
    seedItems,

    seed(values: Values): void {
      changed();
      seeds = { ...seeds, ...values };
    },

    resetStarts(values: Values): void {
      seeds = { ...values };
      memory.clear();
      forgetItems();
      for (const group of groups) seedItems(values[group.key]);
    },

    loadPayload(): void {
      changed();
      remembering = false;
      forgetItems();
      for (const key of Object.keys(seeds)) memory.set(key, undefined);
    },

    remember(key: string, value: unknown, written = false): void {
      if (!remembering) return;
      memory.set(key, value);
      if (written) writes?.add(key);
    },

    watchWrites(): () => Set<string> {
      const seen = new Set<string>();
      writes = seen;
      return () => {
        if (writes === seen) writes = undefined;
        return seen;
      };
    },

    rememberItem(item: unknown, key: string, value: unknown): void {
      if (!remembering || !isEntry(item)) return;
      const id = itemKey(item);
      itemMemory.set(id, { ...itemMemory.get(id), [key]: value });
    },

    dropItem(item: unknown): void {
      if (!isEntry(item)) return;
      itemSeeds.delete(itemKey(item));
      itemMemory.delete(itemKey(item));
    },

    reseed(keys: string[], values: Values): (kept: Set<string>) => void {
      changed();
      const previous = keys.map((key) => [key, seeds[key], memory.has(key), memory.get(key)] as const);
      for (const key of keys) {
        memory.delete(key);
        seeds[key] = values[key];
        seedItems(values[key]);
      }
      return (kept) => {
        changed();
        for (const [key, seed, remembered, value] of previous) {
          seeds[key] = seed;
          if (kept.has(key)) continue;
          if (remembered) memory.set(key, value);
          else memory.delete(key);
        }
      };
    },

    startValue(field: FormField): unknown {
      const { key } = field;
      const remembered = field.type !== 'hidden' && memory.has(key);
      return remembered ? memory.get(key) : seeds[key];
    },

    itemStartValue(item: unknown, key: string): unknown {
      if (!isEntry(item)) return undefined;
      const remembered = itemMemory.get(itemKey(item));
      return remembered && hasOwn(remembered, key) ? remembered[key] : itemSeeds.get(itemKey(item))?.[key];
    },
  };
}
