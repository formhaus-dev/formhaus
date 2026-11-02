import type { FormDefinition, FormField, FormNode } from '../types';
import { SCALE_TYPES, scalePoints } from '../validation/type-checks';
import { isGroup, isSection, topNodes } from '../visibility/nodes';
import { fnv1a } from './hash';

const clean = (value: string) => value.replace(/[^\w-]/g, '-');
const base = (key: string) => clean(key).replace(/-{2,}reveal/g, '-reveal');
const cache = new WeakMap<FormDefinition, Map<string, Map<string, string>>>();

const NUMBERED = /^-\d+(-description)?$/;

const holds = (parts: string[], part: string) => parts.includes(part) || (parts.includes('#') && NUMBERED.test(part));

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

const meets = (owner: string, parts: string[], id: string, own: string[]) => {
  const rest = id.slice(owner.length);
  return id.startsWith(owner) && rest[0] === '-' && (holds(parts, rest) || own.some((part) => holds(parts, rest + part)));
};

function assign(names: Map<string, string[]>, groups = new Set<string>()): Map<string, string> {
  const ids = new Map<string, string>();
  const taken = new Map<string, string[]>();
  const keys = [...names.keys()].sort(
    (a, b) =>
      +groups.has(a) - +groups.has(b) || (groups.has(a) ? (a < b ? 1 : -1) : +(base(b) === b) - +(base(a) === a) || (a < b ? -1 : 1)),
  );
  const prefixes = (id: string) => [...taken.keys()].some((other) => other.startsWith(`${id}--`));
  for (const key of keys) {
    const own = names.get(key)!;
    const clashes = (id: string) =>
      taken.has(id) ||
      (groups.has(key) && prefixes(id)) ||
      [...taken].some(([other, parts]) => meets(other, parts, id, own) || meets(id, own, other, parts));
    let id = base(key);
    for (let seed = key; clashes(id); seed = id) id = `${base(key)}-${fnv1a(seed).toString(36)}`;
    taken.set(id, own);
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
