import type { FormDefinition } from '../types';
import { isGroup, isSection, topNodes } from '../visibility/nodes';
import { fnv1a } from './hash';

const clean = (value: string) => value.replace(/[^\w-]/g, '-');
const cache = new WeakMap<FormDefinition, Map<string, Map<string, string>>>();

function assign(names: Set<string>, groups = new Set<string>()): Map<string, string> {
  const ids = new Map<string, string>();
  const taken = new Set<string>();
  const keys = [...names].sort(
    (a, b) =>
      +groups.has(a) - +groups.has(b) || (groups.has(a) ? (a < b ? 1 : -1) : +(clean(b) === b) - +(clean(a) === a) || (a < b ? -1 : 1)),
  );
  const prefixes = (id: string) => [...taken].some((other) => other.startsWith(`${id}--`));
  for (const key of keys) {
    let id = clean(key);
    for (let seed = key; taken.has(id) || (groups.has(key) && prefixes(id)); seed = id) id = `${clean(key)}-${fnv1a(seed).toString(36)}`;
    taken.add(id);
    ids.set(key, id);
  }
  return ids;
}

function idsOf(definition: FormDefinition): Map<string, Map<string, string>> {
  let scopes = cache.get(definition);
  if (scopes) return scopes;
  const names = new Map<string, Set<string>>([['', new Set()]]);
  const groups = new Set<string>();
  const add = (scope: string, key: string) => names.set(scope, (names.get(scope) ?? new Set()).add(key));
  for (const node of topNodes(definition).flatMap((node) => (isSection(node) ? [node, ...node.fields] : [node]))) {
    add('', node.key);
    if (!isGroup(node)) continue;
    groups.add(node.key);
    for (const field of node.fields) add(`.${node.key}`, field.key);
  }
  scopes = new Map([...names].map(([scope, keys]) => [scope, assign(keys, scope ? undefined : groups)]));
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
