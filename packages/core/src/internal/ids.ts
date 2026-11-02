import { scaleView } from '../fields/scale';
import type { FormDefinition, FormField, FormNode } from '../types';
import { multipleFiles } from '../validation/type-checks';
import { isGroup, isSection, topNodes } from '../visibility/nodes';
import { fnv1a } from './hash';

const clean = (value: string) => value.replace(/[^\w-]/g, '-');
const base = (key: string) => clean(key).replace(/-{2,}reveal/g, '-reveal');
const cache = new WeakMap<FormDefinition, Map<string, Map<string, string>>>();

const UNLABELLED = ['checkbox', 'radio', 'multiselect', 'scale', 'rating', 'hidden'];
const DYNAMIC = /^-\d+(-description)?$/;

interface Parts {
  fixed: string[];
  dynamic?: RegExp;
}

function partsOf(definition: FormDefinition, node: FormNode): Parts {
  if (isSection(node)) return { fixed: node.description ? ['-description'] : [] };
  const fixed = ['-error', ...(node.helperText ? ['-helper'] : [])];
  if (isGroup(node)) return { fixed: [...fixed, '-confirm', '-confirm-title', '-confirm-description'], dynamic: /^--\d/ };
  const field = node as FormField;
  if (field.type === 'hidden') return { fixed: [] };
  if (!UNLABELLED.includes(field.type)) fixed.push('-label');
  if (field.type === 'autocomplete') fixed.push('-list');
  if (multipleFiles(definition, field)) fixed.push('-notice');
  if (field.type === 'scale' || field.type === 'rating') {
    const { points, anchors } = scaleView(field);
    return {
      fixed: [...fixed, ...points.map((point) => `-${point}`), ...anchors.flatMap((anchor, index) => (anchor ? [`-anchor-${index}`] : []))],
    };
  }
  if (field.type !== 'radio' && field.type !== 'multiselect') return { fixed };
  const options = field.options ?? [];
  const dynamic = !!field.optionsFrom || options.length === 0;
  fixed.push(...options.flatMap((option, index) => [`-${index}`, ...(option.description ? [`-${index}-description`] : [])]));
  if (options[0]?.description) fixed.push('-description');
  return dynamic ? { fixed: [...fixed, '-description'], dynamic: DYNAMIC } : { fixed };
}

const holds = ({ fixed, dynamic }: Parts, part: string) => fixed.includes(part) || !!dynamic?.test(part);

const meets = (owner: Parts, rest: string, own: Parts) =>
  holds(owner, rest) ||
  own.fixed.some((part) => holds(owner, rest + part)) ||
  (!!own.dynamic && owner.fixed.some((part) => part.startsWith(rest) && own.dynamic!.test(part.slice(rest.length))));

function separate(definition: FormDefinition, ids: Map<string, string>, nodes: Map<string, FormNode[]>): Map<string, string> {
  const owners = new Map<string, Parts>();
  const others = new Set(ids.values());
  const order = [...ids].sort(([, a], [, b]) => a.length - b.length || (a < b ? -1 : 1));
  const merged = (key: string): Parts => {
    const all = (nodes.get(key) ?? []).map((node) => partsOf(definition, node));
    return { fixed: all.flatMap(({ fixed }) => fixed), dynamic: all.find(({ dynamic }) => dynamic)?.dynamic };
  };
  for (const [key, first] of order) {
    const own = merged(key);
    const claimed = (id: string) =>
      [...id.matchAll(/-/g)].some(({ index }) => {
        const owner = owners.get(id.slice(0, index));
        return owner !== undefined && meets(owner, id.slice(index), own);
      });
    let id = first;
    for (let seed = key; owners.has(id) || claimed(id) || (id !== first && others.has(id)); seed = id)
      id = `${base(key)}-${fnv1a(seed).toString(36)}`;
    owners.set(id, own);
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
  scopes = new Map(
    [...names].map(([scope, keys]) => [scope, separate(definition, assign(new Set(keys.keys()), scope ? undefined : groups), keys)]),
  );
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
