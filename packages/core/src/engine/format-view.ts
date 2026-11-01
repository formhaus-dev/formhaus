import { formatAtLeast } from '../definition-validation/format';
import type { FormDefinition } from '../types';
import { hasOwn, isEntry } from '../visibility/nodes';

type Entry = Record<string, unknown>;

const NEWER = { option: ['description', 'disabled'], field: ['readOnly', 'reorderable'] };

export function formatView(definition: FormDefinition): FormDefinition {
  if (formatAtLeast(definition, 8)) return definition;
  let changed = false;
  const strip = (node: Entry, keys: string[]): Entry => {
    if (!keys.some((key) => hasOwn(node, key))) return node;
    changed = true;
    const copy = { ...node };
    for (const key of keys) delete copy[key];
    return copy;
  };
  const list = (items: unknown, map: (item: Entry) => Entry) =>
    Array.isArray(items) ? items.map((item) => (isEntry(item) ? map(item) : item)) : items;
  const node = (item: Entry): Entry => {
    const copy = strip(item, NEWER.field);
    const nested: Entry = {};
    if (Array.isArray(copy.options)) nested.options = list(copy.options, (option) => strip(option, NEWER.option));
    if (Array.isArray(copy.fields)) nested.fields = list(copy.fields, node);
    return { ...copy, ...nested };
  };
  const view = { ...definition } as Entry;
  if (definition.fields) view.fields = list(definition.fields, node);
  if (definition.steps) view.steps = list(definition.steps, (step) => ({ ...step, fields: list(step.fields, node) }));
  return changed ? (view as unknown as FormDefinition) : definition;
}
