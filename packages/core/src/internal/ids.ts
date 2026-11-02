import type { FormDefinition, FormNode } from '../types';
import { isGroup, isSection, topNodes } from '../visibility/nodes';
import { fnv1a } from './hash';

const clean = (value: string) => value.replace(/[^\w-]/g, '-');
const base = (key: string) => clean(key).replace(/-{2,}reveal/g, '-reveal');
const cache = new WeakMap<FormDefinition, Map<string, Map<string, string>>>();

const PARTS: Record<string, RegExp> = {
  radio: /^-\d+(-description)?$/,
  multiselect: /^-\d+(-description)?$/,
  scale: /^-(-?\d+|anchor(-\d+)?)$/,
  rating: /^-(-?\d+|anchor(-\d+)?)$/,
  autocomplete: /^-list$/,
  file: /^-notice$/,
  group: /^-(confirm(-title|-description)?)?$/,
};

const claims = (nodes: FormNode[], rest: string) =>
  /^-(helper|error|label|description)$/.test(rest) || nodes.some((node) => PARTS[node.type]?.test(rest));

function separate(ids: Map<string, string>, nodes: Map<string, FormNode[]>): Map<string, string> {
  const owners = new Map<string, string>();
  const others = new Set(ids.values());
  const order = [...ids].sort(([, a], [, b]) => a.length - b.length || (a < b ? -1 : 1));
  const claimed = (id: string) =>
    [...id.matchAll(/-/g)].some(({ index }) => {
      const owner = owners.get(id.slice(0, index));
      return owner !== undefined && claims(nodes.get(owner) ?? [], id.slice(index));
    });
  for (const [key, first] of order) {
    let id = first;
    for (let seed = key; owners.has(id) || claimed(id) || (id !== first && others.has(id)); seed = id)
      id = `${base(key)}-${fnv1a(seed).toString(36)}`;
    owners.set(id, key);
    ids.set(key, id);
  }
  return ids;
}

function assign(names: Set<string>, groups = new Set<string>()): Map<string, string> {
  const ids = new Map<string, string>();
  const taken = new Set<string>();
  const keys = [...names].sort(
    (a, b) =>
      +groups.has(a) - +groups.has(b) || (groups.has(a) ? (a < b ? 1 : -1) : +(base(b) === b) - +(base(a) === a) || (a < b ? -1 : 1)),
  );
  const prefixes = (id: string) => [...taken].some((other) => other.startsWith(`${id}--`));
  for (const key of keys) {
    let id = base(key);
    for (let seed = key; taken.has(id) || (groups.has(key) && prefixes(id)); seed = id) id = `${base(key)}-${fnv1a(seed).toString(36)}`;
    taken.add(id);
    ids.set(key, id);
  }
  return ids;
}

function idsOf(definition: FormDefinition): Map<string, Map<string, string>> {
  let scopes = cache.get(definition);
  if (scopes) return scopes;
  const names = new Map<string, Map<string, FormNode[]>>([['', new Map()]]);
  const groups = new Set<string>();
  const add = (scope: string, node: FormNode) => {
    const keys = names.get(scope) ?? names.set(scope, new Map()).get(scope)!;
    keys.set(node.key, [...(keys.get(node.key) ?? []), node]);
  };
  for (const node of topNodes(definition).flatMap((node) => (isSection(node) ? [node, ...node.fields] : [node]))) {
    add('', node);
    if (!isGroup(node)) continue;
    groups.add(node.key);
    for (const field of node.fields) add(`.${node.key}`, field);
  }
  scopes = new Map([...names].map(([scope, keys]) => [scope, separate(assign(new Set(keys.keys()), scope ? undefined : groups), keys)]));
  cache.set(definition, scopes);
  return scopes;
}

const nodeId = (key: string, scope: string, definition?: FormDefinition) =>
  (definition && idsOf(definition).get(scope)?.get(key)) ?? base(key);

export function fieldDomId(formId: string | undefined, key: string, definition?: FormDefinition): string {
  return `${formId ? clean(formId) : 'fh'}-${nodeId(key, '', definition)}`;
}

export function itemDomId(formId: string | undefined, group: string, index: number, field?: string, definition?: FormDefinition): string {
  return `${fieldDomId(formId, group, definition)}--${index}${field === undefined ? '' : `--${nodeId(field, `.${group}`, definition)}`}`;
}
