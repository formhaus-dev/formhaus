import type { FormDefinition, FormField, FormGroup, FormNode, FormSection } from '../types';
import { isPlainEntry, trimValue } from '../validation/type-checks';
import { isVisible } from './is-visible';

type Values = Record<string, unknown>;

export const isEntry = (value: unknown): value is Values => typeof value === 'object' && value !== null && !Array.isArray(value);

export const hasOwn = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);

export const isSection = (node: { type?: unknown }): node is FormSection => node.type === 'section';
export const isGroup = (node: { type?: unknown }): node is FormGroup => node.type === 'group';

export function valueFields(nodes: FormNode[]): FormField[] {
  return nodes.flatMap((node) => (isSection(node) ? node.fields : [node])) as FormField[];
}

export function topNodes(definition: FormDefinition): FormNode[] {
  return definition.steps?.length ? definition.steps.flatMap((step) => step.fields) : (definition.fields ?? []);
}

export function conditionFields(source: Pick<FormField, 'show' | 'showAny'>): string[] {
  return [...(source.show ?? []), ...(source.showAny ?? [])].map((condition) => condition.field);
}

export function shownFields(nodes: FormNode[], values: Values): FormField[] {
  return nodes.flatMap((node) =>
    !isVisible(node, values) ? [] : isSection(node) ? node.fields.filter((field) => isVisible(field, values)) : [node],
  ) as FormField[];
}

export const itemsOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function withItem(scope: Values, group: FormGroup, item: unknown): Values {
  const source = isEntry(item) ? item : {};
  for (const field of group.fields) scope[field.key] = trimValue(field, source[field.key]);
  return scope;
}

export function itemScope(group: FormGroup, item: unknown, values: Values): Values {
  return withItem({ ...values }, group, item);
}

export function itemView(group: FormGroup, item: unknown, values: Values): Values {
  return withItem(Object.create(values), group, item);
}

export function cleanItems(group: FormGroup, value: unknown, values: Values): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item) => {
    if (!isPlainEntry(item)) return item;
    const scope = itemView(group, item, values);
    const result: Values = {};
    for (const field of group.fields) {
      if (scope[field.key] !== undefined && isVisible(field, scope)) result[field.key] = scope[field.key];
    }
    return result;
  });
}

export const optionKey = (group: string, field: string): string => `${group}.${field}`;

export function itemPath(group: string, index: number, field: string): string {
  return `${group}.${index}.${field}`;
}

export function splitPath(group: string, key: string): [number, string] | undefined {
  if (!key.startsWith(`${group}.`)) return undefined;
  const rest = key.slice(group.length + 1);
  const match = /^(0|[1-9]\d*)\.(.+)$/.exec(rest);
  return match ? [Number(match[1]), match[2]] : undefined;
}

type ItemKey = { id: string };
const keys = new WeakMap<object, ItemKey>();
let lastId = 0;

export function itemKey(item: Values): ItemKey {
  let key = keys.get(item);
  if (key === undefined) keys.set(item, (key = { id: `i${++lastId}` }));
  return key;
}

export function itemId(item: unknown, index: number): string {
  return isEntry(item) ? itemKey(item).id : `${index}`;
}

export function keepId<T extends object>(from: unknown, to: T): T {
  if (isEntry(from)) keys.set(to, itemKey(from));
  return to;
}
