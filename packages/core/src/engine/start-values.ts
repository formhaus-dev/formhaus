import type { FormField, FormGroup } from '../types';
import { hasOwn, isEntry, isGroup, itemId, itemsOf } from '../visibility/nodes';
import { createValues } from './engine-utils';

type Values = Record<string, unknown>;

export function createStartValues(groups: FormGroup[]) {
  let seeds: Values = {};
  const edits = new Set<string>();
  const itemEdits = new Set<string>();
  const itemSeeds = new Map<string, Values>();
  const itemEdit = (item: unknown, key: string) => `${itemId(item, 0)}.${key}`;
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
      edits.clear();
      itemEdits.clear();
      itemSeeds.clear();
      for (const group of groups) seedItems(values[group.key]);
    },

    markEdited(key: string): void {
      edits.add(key);
    },

    dropItem(item: unknown): void {
      if (isEntry(item)) itemSeeds.delete(itemId(item, 0));
    },

    markItemEdited(item: unknown, key: string): void {
      itemEdits.add(itemEdit(item, key));
    },

    reseed(keys: string[], values: Values): () => void {
      const previous = keys.map((key) => [key, seeds[key], edits.has(key)] as const);
      for (const key of keys) {
        edits.delete(key);
        seeds[key] = values[key];
        seedItems(values[key]);
      }
      return () => {
        for (const [key, seed, edited] of previous) {
          seeds[key] = seed;
          if (edited) edits.add(key);
        }
      };
    },

    startValue(field: FormField): unknown {
      const { key } = field;
      if ((field.type === 'hidden' || !edits.has(key)) && seeds[key] !== undefined) return seeds[key];
      return isGroup(field) && field.defaultItems! > 0 && hasOwn(seeds, key) ? createValues([field])[key] : undefined;
    },

    itemStartValue(item: unknown, key: string): unknown {
      const seed = isEntry(item) ? itemSeeds.get(itemId(item, 0)) : undefined;
      return itemEdits.has(itemEdit(item, key)) ? undefined : seed?.[key];
    },
  };
}
