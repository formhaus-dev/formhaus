import type { FormField, FormGroup, FormNode, FormSection } from '../types';
import { trimValue } from '../validation/type-checks';
import { isVisible } from './is-visible';

type Values = Record<string, unknown>;

export const isEntry = (value: unknown): value is Values => typeof value === 'object' && value !== null && !Array.isArray(value);

export const isSection = (node: { type?: unknown }): node is FormSection => node.type === 'section';
export const isGroup = (node: { type?: unknown }): node is FormGroup => node.type === 'group';

export function valueFields(nodes: FormNode[]): FormField[] {
  return nodes.flatMap((node) => (isSection(node) ? node.fields : [node]));
}

export function shownFields(nodes: FormNode[], values: Values): FormField[] {
  return nodes.flatMap((node) =>
    !isVisible(node, values) ? [] : isSection(node) ? node.fields.filter((field) => isVisible(field, values)) : [node],
  );
}

export const itemsOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export function itemScope(group: FormGroup, item: unknown, values: Values): Values {
  const scope = { ...values };
  const source = isEntry(item) ? item : {};
  for (const field of group.fields) scope[field.key] = trimValue(field, source[field.key]);
  return scope;
}

export function cleanItems(group: FormGroup, value: unknown, values: Values): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item) => {
    const scope = itemScope(group, item, values);
    const result: Values = {};
    for (const field of group.fields) {
      if (scope[field.key] !== undefined && isVisible(field, scope)) result[field.key] = scope[field.key];
    }
    return result;
  });
}

export function itemPath(group: string, index: number, field: string): string {
  return `${group}.${index}.${field}`;
}

export function splitPath(group: string, key: string): [number, string] | undefined {
  if (!key.startsWith(`${group}.`)) return undefined;
  const rest = key.slice(group.length + 1);
  const match = /^(0|[1-9]\d*)\.(.+)$/.exec(rest);
  return match ? [Number(match[1]), match[2]] : undefined;
}

const ids = new WeakMap<object, string>();
let lastId = 0;

export function itemId(item: unknown, index: number): string {
  if (!isEntry(item)) return `${index}`;
  let id = ids.get(item);
  if (id === undefined) ids.set(item, (id = `i${++lastId}`));
  return id;
}

export function keepId<T extends object>(from: unknown, to: T): T {
  ids.set(to, itemId(from, 0));
  return to;
}
