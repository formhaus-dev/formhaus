import { getAllFields } from '../engine/engine-utils';
import type { FormDefinition } from '../types';

const clean = (value: string) => value.replace(/[^\w-]/g, '-');
const cache = new WeakMap<FormDefinition, Map<string, string>>();

function hash(text: string): string {
  let value = 0x811c9dc5;
  for (const char of text) value = Math.imul(value ^ char.codePointAt(0)!, 0x01000193) >>> 0;
  return value.toString(36);
}

function idsOf(definition: FormDefinition): Map<string, string> {
  let ids = cache.get(definition);
  if (ids) return ids;
  ids = new Map();
  const taken = new Set<string>();
  const keys = [...new Set(getAllFields(definition).map((field) => field.key))]
    .sort((a, b) => +(clean(b) === b) - +(clean(a) === a) || (a < b ? -1 : 1));
  for (const key of keys) {
    let id = clean(key);
    for (let seed = key; taken.has(id); seed = id) id = `${clean(key)}-${hash(seed)}`;
    taken.add(id);
    ids.set(key, id);
  }
  cache.set(definition, ids);
  return ids;
}

export function fieldDomId(formId: string | undefined, key: string, definition?: FormDefinition): string {
  return `${formId ? clean(formId) : 'fh'}-${(definition && idsOf(definition).get(key)) ?? clean(key)}`;
}
