import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FieldOption, FormField } from '../types';
import { conditionsMet } from '../visibility/evaluate-condition';
import { itemsOf, itemView } from '../visibility/nodes';

export interface FieldRules {
  readOnly: boolean;
  options?: FieldOption[];
}

function ruleScope(engine: FormEngine, path?: string): Record<string, unknown> {
  const { visibility, state } = engine as unknown as EngineInternals;
  const values = visibility.conditionValues(state.values);
  const parts = path ? visibility.parse(path) : undefined;
  const group = parts && visibility.groups.find((candidate) => candidate.key === parts[0]);
  return group && parts ? itemView(group, itemsOf(state.values[group.key])[parts[1]], values) : values;
}

export const conditionalRules = (field: FormField, options = field.options): boolean =>
  Array.isArray(field.readOnly) || !!options?.some((option) => Array.isArray(option.disabled));

export function fieldRules(engine: FormEngine, field: FormField, options = field.options, path?: string): FieldRules {
  if (field.readOnly === undefined && !options?.some((option) => option.disabled !== undefined)) return { readOnly: false, options };
  const scope = ruleScope(engine, path);
  return {
    readOnly: conditionsMet(field.readOnly, scope),
    options: options?.map((option) =>
      option.disabled === undefined ? option : { ...option, disabled: conditionsMet(option.disabled, scope) },
    ),
  };
}

export function matrixView(engine: FormEngine, field: FormField, columns: FieldOption[] | undefined, row = 0, path?: string) {
  return columns && { columns: fieldRules(engine, field, columns, path).options ?? columns, row };
}
