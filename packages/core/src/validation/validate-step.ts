import type { FormGroup, FormNode, FormStep } from '../types';
import { isGroup, isVisible } from '../visibility';
import { itemPath, itemsOf, itemScope, itemView, shownFields, valueFields } from '../visibility/nodes';
import { type ValidateOptions, validateFieldValue, withPatternBudget } from './validate-field';

export function validateStep(step: FormStep, values: Record<string, unknown>, options?: ValidateOptions): Record<string, string> {
  return validateFields(step.fields, values, options);
}

export const customRules = (nodes: FormNode[]) =>
  valueFields(nodes).some((field) => [field, ...(isGroup(field) ? field.fields : [])].some((rule) => rule.validation?.validator));

function validateItems(
  group: FormGroup,
  values: Record<string, unknown>,
  scope: Record<string, unknown>,
  options?: ValidateOptions,
): Record<string, string> {
  const errors: Record<string, string> = {};
  itemsOf(values[group.key]).forEach((item, index) => {
    const own = itemScope(group, item, values);
    const shown = itemView(group, item, scope);
    for (const field of group.fields) {
      const error = isVisible(field, shown) && validateFieldValue(field, own[field.key], own, options);
      if (error) errors[itemPath(group.key, index, field.key)] = error;
    }
  });
  return errors;
}

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
      if (isGroup(field)) Object.assign(errors, validateItems(field, values, scope, options));
    }
    return errors;
  });
}
