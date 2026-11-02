import type { FormDefinition, FormField, FormNode } from '../types';
import { SCALE_TYPES, scalePoints } from '../validation/type-checks';
import { isGroup, isSection, topNodes } from '../visibility/nodes';
import { fnv1a } from './hash';

const clean = (value: string) => value.replace(/[^\w-]/g, '-');
const base = (key: string) => clean(key).replace(/-{2,}reveal/g, '-reveal');
const cache = new WeakMap<FormDefinition, Map<string, Map<string, string>>>();

const NUMBERED = /^-\d+(-description)?$/;

const holds = (parts: Set<string>, part: string) => parts.has(part) || (parts.has('#') && NUMBERED.test(part));

function partsOf(node: FormNode): string[] {
  if (isSection(node)) return node.description ? ['-description'] : [];
  const { type, helperText, options = [], multiple, optionsFrom } = node as FormField;
  if (type === 'hidden') return [];
  const parts = ['-error', helperText ? '-helper' : ''];
  if (isGroup(node)) return [...parts, ...'- -confirm -confirm-title -confirm-description'.split(' ')];
  const choice = type === 'radio' || type === 'multiselect';
  const scale = SCALE_TYPES.includes(type);
  if (!choice && !scale && type !== 'checkbox') parts.push('-label');
  parts.push(type === 'autocomplete' ? '-list' : type === 'file' && multiple ? '-notice' : '');
  if (scale) {
    parts.push(...scalePoints(node as FormField).map((point) => `-${point}`));
    if (options.length) parts.push(...'-anchor-0 -anchor-1 -anchor-2'.split(' '));
  }
  if (!choice) return parts;
  parts.push(...options.flatMap(({ description }, index) => [`-${index}`, description ? `-${index}-description` : '']));
  if (optionsFrom || !options.length) parts.push('#', '-description', '-0', '-1', '-2');
  else if (options[0].description) parts.push('-description');
  return parts;
}

const NUMBERED_END = /-\d+(-description)?$/;

function ends(id: string, longest: number): number[] {
  const found = [];
  for (let index = id.lastIndexOf('-'); index > 0 && index >= id.length - longest; index = id.lastIndexOf('-', index - 1))
    found.push(index);
  return found;
}

const numberedEnd = (id: string) => NUMBERED_END.exec(id)?.index ?? 0;

function assign(names: Map<string, string[]>, groups = new Set<string>()): Map<string, string> {
  const ids = new Map<string, string>();
  const taken = new Map<string, Set<string>>();
  const numbered = new Set<string>();
  const nested = new Set<string>();
  const tails = new Map<string, [string, string[]][]>();
  const longest = [...names.values()].flat().reduce((most, part) => Math.max(most, part.length), 0);
  const plain = new Set([...names.keys()].filter((key) => base(key) === key));
  const keys = [...names.keys()].sort(
    (a, b) => +groups.has(a) - +groups.has(b) || (groups.has(a) ? (a < b ? 1 : -1) : +plain.has(b) - +plain.has(a) || (a < b ? -1 : 1)),
  );
  for (const key of keys) {
    const parts = names.get(key)!;
    const own = new Set(parts);
    const claims = (id: string, index: number) => {
      const owner = taken.get(id.slice(0, index));
      const rest = id.slice(index);
      return !!owner && (holds(owner, rest) || parts.some((part) => holds(owner, rest + part)));
    };
    const claimed = (id: string) =>
      ends(id, longest).some((index) => claims(id, index)) || (numberedEnd(id) > 0 && claims(id, numberedEnd(id)));
    const claiming = (id: string) =>
      (own.has('#') && numbered.has(id)) ||
      !!tails.get(id)?.some(([rest, other]) => holds(own, rest) || other.some((part) => holds(own, rest + part)));
    const clashes = (id: string) => taken.has(id) || (groups.has(key) && nested.has(id)) || claimed(id) || claiming(id);
    let id = base(key);
    for (let seed = key; clashes(id); seed = id) id = `${base(key)}-${fnv1a(seed).toString(36)}`;
    taken.set(id, own);
    if (numberedEnd(id)) numbered.add(id.slice(0, numberedEnd(id)));
    for (const index of ends(id, longest)) {
      const owner = id.slice(0, index);
      tails
        .set(owner, tails.get(owner) ?? [])
        .get(owner)!
        .push([id.slice(index), parts]);
    }
    for (let index = id.indexOf('--'); index >= 0; index = id.indexOf('--', index + 1)) nested.add(id.slice(0, index));
    ids.set(key, id);
  }
  return ids;
}

function idsOf(definition: FormDefinition): Map<string, Map<string, string>> {
  let scopes = cache.get(definition);
  if (scopes) return scopes;
  const names = new Map<string, Map<string, string[]>>([['', new Map()]]);
  const groups = new Set<string>();
  const add = (scope: string, node: FormNode) => {
    const keys = names.get(scope) ?? names.set(scope, new Map()).get(scope)!;
    keys.set(node.key, [...(keys.get(node.key) ?? []), ...partsOf(node)]);
  };
  for (const node of topNodes(definition).flatMap((node) => (isSection(node) ? [node, ...node.fields] : [node]))) {
    add('', node);
    if (!isGroup(node)) continue;
    groups.add(node.key);
    for (const field of node.fields) add(`.${node.key}`, field);
  }
  scopes = new Map([...names].map(([scope, keys]) => [scope, assign(keys, scope ? undefined : groups)]));
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
