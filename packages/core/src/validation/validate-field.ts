import type { FieldValidation, FormField } from '../types';
import { getDefaultMessage } from './default-messages';

export type ValidatorFn = (value: unknown, allValues: Record<string, unknown>) => string | null;

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function validateField(
  field: FormField,
  value: unknown,
  allValues: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
): string | null {
  const rules = field.validation;
  if (!rules) return null;

  if (rules.required) {
    if (isEmpty(value)) {
      return typeof rules.required === 'string' ? rules.required : getDefaultMessage('required');
    }
  }

  // Skip remaining rules if value is empty and not required
  if (isEmpty(value)) return null;

  if (rules.minLength !== undefined && (typeof value === 'string' || Array.isArray(value))) {
    if ((value as string | unknown[]).length < rules.minLength) {
      return rules.minLengthMessage ?? getDefaultMessage('minLength', { min: rules.minLength });
    }
  }

  if (rules.maxLength !== undefined && (typeof value === 'string' || Array.isArray(value))) {
    if ((value as string | unknown[]).length > rules.maxLength) {
      return rules.maxLengthMessage ?? getDefaultMessage('maxLength', { max: rules.maxLength });
    }
  }

  if (rules.min !== undefined && typeof value === 'number') {
    if (value < rules.min) {
      return rules.minMessage ?? getDefaultMessage('min', { min: rules.min });
    }
  }

  if (rules.max !== undefined && typeof value === 'number') {
    if (value > rules.max) {
      return rules.maxMessage ?? getDefaultMessage('max', { max: rules.max });
    }
  }

  if (rules.pattern !== undefined) {
    try {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(String(value))) {
        return rules.patternMessage ?? getDefaultMessage('pattern');
      }
    } catch {
      // Invalid regex: skip validation silently
    }
  }

  if (rules.matchField !== undefined) {
    const otherValue = allValues[rules.matchField];
    if (value !== otherValue) {
      return rules.matchFieldMessage ?? getDefaultMessage('matchField');
    }
  }

  if (rules.validator !== undefined && validators) {
    const customValidator = validators[rules.validator];
    if (customValidator) {
      return customValidator(value, allValues);
    }
  }

  return null;
}
