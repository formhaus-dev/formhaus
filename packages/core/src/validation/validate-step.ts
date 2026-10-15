import type { FormGroup, FormNode, FormStep } from '../types';
import { isGroup, isVisible } from '../visibility';
import { itemPath, itemsOf, itemScope, shownFields } from '../visibility/nodes';
import type { MessageSource } from './default-messages';
import { type ValidatorFn, validateFieldValue } from './validate-field';

export function validateStep(
  step: FormStep,
  values: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
  messages?: MessageSource,
): Record<string, string> {
  return validateFields(step.fields, values, validators, messages);
}

export function validateItems(
  group: FormGroup,
  values: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
  messages?: MessageSource,
): Record<string, string> {
  const errors: Record<string, string> = {};
  itemsOf(values[group.key]).forEach((item, index) => {
    const scope = itemScope(group, item, values);
    for (const field of group.fields) {
      const error = isVisible(field, scope) && validateFieldValue(field, scope[field.key], scope, validators, messages);
      if (error) errors[itemPath(group.key, index, field.key)] = error;
    }
  });
  return errors;
}

export function validateFields(
  fields: FormNode[],
  values: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
  messages?: MessageSource,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of shownFields(fields, values)) {
    const error = validateFieldValue(field, values[field.key], values, validators, messages);
    if (error) {
      errors[field.key] = error;
    }
    if (isGroup(field)) Object.assign(errors, validateItems(field, values, validators, messages));
  }

  return errors;
}
