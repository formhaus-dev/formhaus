import type { FormDefinition } from '../types';
import { isGroup, isSection, topNodes } from '../visibility/nodes';

const clean = (value: string) => value.replace(/[^\w-]/g, '-');
const cache = new WeakMap<FormDefinition, Map<string, Map<string, string>>>();

function hash(text: string): string {
  let value = 0x811c9dc5;
  for (const char of text) value = Math.imul(value ^ char.codePointAt(0)!, 0x01000193) >>> 0;
  return value.toString(36);
}

function assign(names: Set<string>): Map<string, string> {
  const ids = new Map<string, string>();
  const taken = new Set<string>();
  const keys = [...names].sort((a, b) => +(clean(b) === b) - +(clean(a) === a) || (a < b ? -1 : 1));
  for (const key of keys) {
    let id = clean(key);
    for (let seed = key; taken.has(id); seed = id) id = `${clean(key)}-${hash(seed)}`;
    taken.add(id);
    ids.set(key, id);
  }
  return ids;
}

function idsOf(definition: FormDefinition): Map<string, Map<string, string>> {
  let scopes = cache.get(definition);
  if (scopes) return scopes;
  const names = new Map<string, Set<string>>([['', new Set()]]);
  const add = (scope: string, key: string) => names.set(scope, (names.get(scope) ?? new Set()).add(key));
  for (const node of topNodes(definition).flatMap((node) => (isSection(node) ? [node, ...node.fields] : [node]))) {
    add('', node.key);
    if (isGroup(node)) for (const field of node.fields) add(`.${node.key}`, field.key);
  }
  scopes = new Map([...names].map(([scope, keys]) => [scope, assign(keys)]));
  cache.set(definition, scopes);
  return scopes;
}

const nodeId = (key: string, scope: string, definition?: FormDefinition) =>
  (definition && idsOf(definition).get(scope)?.get(key)) ?? clean(key);

export function fieldDomId(formId: string | undefined, key: string, definition?: FormDefinition): string {
  return `${formId ? clean(formId) : 'fh'}-${nodeId(key, '', definition)}`;
}

export function itemDomId(formId: string | undefined, group: string, index: number, field?: string, definition?: FormDefinition): string {
  return `${fieldDomId(formId, group, definition)}--${index}${field === undefined ? '' : `--${nodeId(field, `.${group}`, definition)}`}`;
}
