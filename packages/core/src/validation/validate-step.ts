import type { FormField, FormStep } from '../types';
import { isVisible } from '../visibility';
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

export function validateFields(
  fields: FormField[],
  values: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
  messages?: MessageSource,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!isVisible(field, values)) continue;

    const error = validateFieldValue(field, values[field.key], values, validators, messages);
    if (error) {
      errors[field.key] = error;
    }
  }

  return errors;
}
