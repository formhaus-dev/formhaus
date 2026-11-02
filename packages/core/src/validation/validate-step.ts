import type { FormField, FormGroup, FormNode, FormStep } from '../types';
import { isGroup, isVisible } from '../visibility';
import { isEntry, itemPath, itemsOf, itemScope, itemView, shownFields, valueFields } from '../visibility/nodes';
import { type ValidateOptions, validateFieldValue, withPatternBudget } from './validate-field';
import { typeError } from './type-checks';

export function validateStep(step: FormStep, values: Record<string, unknown>, options?: ValidateOptions): Record<string, string> {
  return validateFields(step.fields, values, options);
}

export const customRules = (nodes: FormNode[]) =>
  valueFields(nodes).some((field) => [field, ...(isGroup(field) ? field.fields : [])].some((rule) => rule.validation?.validator));

export function validateFields(fields: FormNode[], values: Record<string, unknown>, options?: ValidateOptions): Record<string, string> {
  return validateShown(fields, values, values, options);
}

export function visitShown(
  fields: FormNode[],
  values: Record<string, unknown>,
  scope: Record<string, unknown>,
  visit: (path: string, field: FormField, own: Record<string, unknown>, item?: [FormGroup, number]) => void,
): void {
  for (const field of shownFields(fields, scope)) {
    visit(field.key, field, values);
    if (isGroup(field) && !typeError(field, values[field.key]))
      itemsOf(values[field.key]).forEach((item, index) => {
        const own = itemScope(field, item, values);
        const shown = itemView(field, item, scope);
        for (const rule of field.fields) if (isVisible(rule, shown)) visit(itemPath(field.key, index, rule.key), rule, own, [field, index]);
      });
  }
}

const occurrences = (items: unknown[], key: string) => items.flatMap((item) => (isEntry(item) ? ([] as unknown[]).concat(item[key]) : []));

export function itemHolds(options: ValidateOptions | undefined, group: FormGroup, items: unknown[]) {
  const previous = options?.previousValues;
  const fields = group.fields.filter((field) => field.options?.some((option) => option.disabled !== undefined));
  if (!previous || !fields.length) return () => options;
  const counts = fields.map((field) => {
    const disabled = new Set(field.options!.filter((option) => option.disabled !== undefined).map((option) => option.value));
    const left = new Map<unknown, number>();
    for (const value of occurrences(itemsOf(previous[group.key]), field.key))
      if (disabled.has(value)) left.set(value, (left.get(value) ?? 0) + 1);
    return [field.key, left] as const;
  });
  const take = (left: Map<unknown, number>, values: unknown[]) => {
    const kept = values.filter((value) => (left.get(value) ?? 0) > 0);
    for (const value of values) if (left.get(value)) left.set(value, left.get(value)! - 1);
    return kept;
  };
  const held = items.map((item) => {
    const entry = Object.fromEntries(counts.map(([key, left]) => [key, take(left, occurrences([item], key))]));
    return { ...options, previousValues: { ...previous, ...entry } };
  });
  return (index: number): ValidateOptions | undefined => held[index] ?? options;
}

export function validateShown(
  fields: FormNode[],
  values: Record<string, unknown>,
  scope: Record<string, unknown>,
  options?: ValidateOptions,
): Record<string, string> {
  return withPatternBudget(() => {
    const errors: Record<string, string> = {};
    const holds = new Map<FormGroup, (index: number) => ValidateOptions | undefined>();
    const hold = ([group, index]: [FormGroup, number]) => {
      if (!holds.has(group)) holds.set(group, itemHolds(options, group, itemsOf(values[group.key])));
      return holds.get(group)!(index);
    };
    visitShown(fields, values, scope, (path, field, own, item) => {
      const error = validateFieldValue(field, own[field.key], own, item ? hold(item) : options);
      if (error) errors[path] = error;
    });
    return errors;
  });
}
