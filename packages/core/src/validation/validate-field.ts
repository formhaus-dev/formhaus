import type { FormField } from '../types';
import {
  getCustomError,
  getLengthError,
  getMatchError,
  getPatternError,
  getRangeError,
  getRequiredError,
  type ValidatorFn,
} from './field-rules';

export type { ValidatorFn } from './field-rules';

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return Array.isArray(value) && value.length === 0;
}

export function validateField(
  field: FormField,
  value: unknown,
  allValues: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
): string | null {
  const rules = field.validation;
  if (!rules) return null;
  const empty = isEmpty(value);
  const requiredError = getRequiredError(rules, empty);
  if (requiredError) return requiredError;
  if (empty) return null;

  const lengthError = typeof value === 'string' || Array.isArray(value)
    ? getLengthError(value, rules)
    : undefined;
  const rangeError = typeof value === 'number' ? getRangeError(value, rules) : undefined;
  return lengthError
    ?? rangeError
    ?? getPatternError(value, rules)
    ?? getMatchError(value, allValues, rules)
    ?? getCustomError(value, allValues, rules, validators)
    ?? null;
}
