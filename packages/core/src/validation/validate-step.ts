import type { FormField, FormNode, FormStep } from '../types';
import { isGroup, isVisible } from '../visibility';
import { itemPath, itemsOf, itemScope, itemView, shownFields, valueFields } from '../visibility/nodes';
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
  visit: (path: string, field: FormField, own: Record<string, unknown>) => void,
): void {
  for (const field of shownFields(fields, scope)) {
    visit(field.key, field, values);
    if (isGroup(field) && !typeError(field, values[field.key]))
      itemsOf(values[field.key]).forEach((item, index) => {
        const own = itemScope(field, item, values);
        const shown = itemView(field, item, scope);
        for (const rule of field.fields) if (isVisible(rule, shown)) visit(itemPath(field.key, index, rule.key), rule, own);
      });
  }
}

export function validateShown(
  fields: FormNode[],
  values: Record<string, unknown>,
  scope: Record<string, unknown>,
  options?: ValidateOptions,
): Record<string, string> {
  return withPatternBudget(() => {
    const errors: Record<string, string> = {};
    visitShown(fields, values, scope, (path, field, own) => {
      const error = validateFieldValue(field, own[field.key], own, options);
      if (error) errors[path] = error;
    });
    return errors;
  });
}
