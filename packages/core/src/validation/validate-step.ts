import type { FormNode, FormStep } from '../types';
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

export function validateShown(
  fields: FormNode[],
  values: Record<string, unknown>,
  scope: Record<string, unknown>,
  options?: ValidateOptions,
): Record<string, string> {
  return withPatternBudget(() => {
    const errors: Record<string, string> = {};
    for (const field of shownFields(fields, scope)) {
      const error = validateFieldValue(field, values[field.key], values, options);
      if (error) errors[field.key] = error;
      if (isGroup(field) && !typeError(field, values[field.key]))
        itemsOf(values[field.key]).forEach((item, index) => {
          const own = itemScope(field, item, values);
          const shown = itemView(field, item, scope);
          for (const rule of field.fields) {
            const issue = isVisible(rule, shown) && validateFieldValue(rule, own[rule.key], own, options);
            if (issue) errors[itemPath(field.key, index, rule.key)] = issue;
          }
        });
    }
    return errors;
  });
}
