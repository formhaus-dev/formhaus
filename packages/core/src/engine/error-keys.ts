import type { FormField, FormNode } from '../types';
import { isGroup, itemPath, itemsOf, valueFields } from '../visibility/nodes';
import type { EngineInternals } from './runtime-internals';

function keysOf(nodes: FormNode[], errors: Record<string, string>, values: Record<string, unknown>, hidden: boolean): string[] {
  if (Object.keys(errors).length === 0) return [];
  const own = (field: FormField) => (field.type === 'hidden') === hidden;
  return valueFields(nodes)
    .flatMap((field) => [
      ...(own(field) ? [field.key] : []),
      ...(isGroup(field)
        ? itemsOf(values[field.key]).flatMap((_, index) => field.fields.filter(own).map(({ key }) => itemPath(field.key, index, key)))
        : []),
    ])
    .filter((key) => errors[key] !== undefined);
}

export const errorKeys = (nodes: FormNode[], errors: Record<string, string>, values: Record<string, unknown>): string[] =>
  keysOf(nodes, errors, values, false);

export const hiddenErrorKeys = (nodes: FormNode[], errors: Record<string, string>, values: Record<string, unknown>): string[] =>
  keysOf(nodes, errors, values, true);

export function hiddenErrors({ state: { errors, values }, visibility }: EngineInternals): string[] {
  if (Object.keys(errors).length === 0) return [];
  const fields = visibility.allFields.filter((field) => (visibility.activeField(field.key, values) ?? field) === field);
  return hiddenErrorKeys(fields, errors, values).flatMap((key) => errors[key] || []);
}
