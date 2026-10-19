import type { DefinitionIssue } from '../definition-validation/issues';
import { isEntry, itemsOf } from '../visibility/nodes';
import { parsePointer, type PatchOperation } from './patch';

export interface DefinitionFix {
  title: string;
  safe: boolean;
  patch: PatchOperation[];
}

export type Entry = Record<string, unknown>;

export const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
const strings = (values: unknown[]) => values.filter((value): value is string => typeof value === 'string');

export function at(root: unknown, path: string): unknown {
  if (!path) return root;
  let node = root;
  for (const token of parsePointer(path)) node = isEntry(node) || Array.isArray(node) ? (node as Entry)[token] : undefined;
  return node;
}

export const parent = (path: string) => path.slice(0, path.lastIndexOf('/'));
export const last = (path: string) => parsePointer(path).pop() ?? '';
export const child = (path: string, key: string) => `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;

function flatten(items: unknown): Entry[] {
  return itemsOf(items).flatMap((item) => (isEntry(item) ? [item, ...flatten(item.fields)] : []));
}

function fields(definition: Entry): Entry[] {
  return [...flatten(definition.fields), ...itemsOf(definition.steps).flatMap((step) => flatten(isEntry(step) ? step.fields : undefined))];
}

export const keysOf = (definition: Entry) => strings(fields(definition).map((field) => field.key));
export const stepIds = (definition: Entry) => strings(itemsOf(definition.steps).map((step) => (isEntry(step) ? step.id : undefined)));
export const valuesOf = (options: unknown) => strings(itemsOf(options).map((option) => (isEntry(option) ? option.value : undefined)));

export function references(definition: Entry): Set<string> {
  const found = new Set<string>();
  const visit = (node: unknown, name?: string): void => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (name === 'optionsDependsOn' && typeof item === 'string') found.add(item);
        else if ((name === 'show' || name === 'showAny' || name === 'disabled') && isEntry(item) && typeof item.field === 'string')
          found.add(item.field);
        visit(item);
      }
    } else if (isEntry(node)) {
      if (typeof node.matchField === 'string') found.add(node.matchField);
      for (const [key, value] of Object.entries(node)) visit(value, key);
    }
  };
  visit(definition);
  return found;
}

export function conditionValues(definition: Entry, key: string): unknown[] {
  const found: unknown[] = [];
  const visit = (node: unknown, name?: string): void => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if ((name === 'show' || name === 'showAny' || name === 'disabled') && isEntry(item) && item.field === key) {
          found.push(item.eq, item.neq, item.contains, item.notContains, ...itemsOf(item.in), ...itemsOf(item.notIn));
        }
        visit(item);
      }
    } else if (isEntry(node)) for (const [child, value] of Object.entries(node)) visit(value, child);
  };
  visit(definition);
  return found;
}

export const quoted = (text: string | undefined, pattern: RegExp) => (text === undefined ? undefined : pattern.exec(text)?.[1]);
export const missingName = (issue: DefinitionIssue) => quoted(issue.message, /missing required property "([^"]+)"/);
export const suggestedName = (issue: DefinitionIssue) => quoted(issue.hint, /^Did you mean "([^"]+)"\?$/);

export const fix = (title: string, safe: boolean, ...patch: PatchOperation[]): DefinitionFix => ({ title, safe, patch });
export const set = (path: string, value: unknown): PatchOperation => ({ op: 'add', path, value });
export const quote = (value: unknown) => JSON.stringify(value);
