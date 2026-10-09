import type { FormField, FormStep } from '../types';
import { isVisible } from '../visibility';
import { type ValidatorFn, validateField } from './validate-field';

export function validateStep(
  step: FormStep,
  values: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
): Record<string, string> {
  return validateFields(step.fields, values, validators);
}

export function validateFields(
  fields: FormField[],
  values: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!isVisible(field, values)) continue;

    const error = validateField(field, values[field.key], values, validators);
    if (error) {
      errors[field.key] = error;
    }
  }

  return errors;
}
