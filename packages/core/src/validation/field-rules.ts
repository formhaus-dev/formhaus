import type { FieldValidation } from '../types';
import { getDefaultMessage } from './default-messages';

export type ValidatorFn = (
  value: unknown,
  allValues: Record<string, unknown>,
) => string | null;

export function getRequiredError(
  rules: FieldValidation,
  empty: boolean,
): string | undefined {
  if (!rules.required || !empty) return undefined;
  return typeof rules.required === 'string'
    ? rules.required
    : getDefaultMessage('required');
}

export function getLengthError(
  value: string | unknown[],
  rules: FieldValidation,
): string | undefined {
  const unit = Array.isArray(value) ? 'items' : undefined;
  if (rules.minLength !== undefined && value.length < rules.minLength) {
    return rules.minLengthMessage ?? getDefaultMessage('minLength', {
      min: rules.minLength,
      unit,
    });
  }
  if (rules.maxLength !== undefined && value.length > rules.maxLength) {
    return rules.maxLengthMessage ?? getDefaultMessage('maxLength', {
      max: rules.maxLength,
      unit,
    });
  }
  return undefined;
}

export function getRangeError(value: number, rules: FieldValidation): string | undefined {
  if (rules.min !== undefined && value < rules.min) {
    return rules.minMessage ?? getDefaultMessage('min', { min: rules.min });
  }
  if (rules.max !== undefined && value > rules.max) {
    return rules.maxMessage ?? getDefaultMessage('max', { max: rules.max });
  }
  return undefined;
}

export function getPatternError(value: unknown, rules: FieldValidation): string | undefined {
  if (rules.pattern === undefined) return undefined;
  try {
    return new RegExp(rules.pattern).test(String(value))
      ? undefined
      : rules.patternMessage ?? getDefaultMessage('pattern');
  } catch {
    return undefined;
  }
}

export function getMatchError(
  value: unknown,
  allValues: Record<string, unknown>,
  rules: FieldValidation,
): string | undefined {
  if (rules.matchField === undefined || value === allValues[rules.matchField]) return undefined;
  return rules.matchFieldMessage ?? getDefaultMessage('matchField');
}

export function getCustomError(
  value: unknown,
  allValues: Record<string, unknown>,
  rules: FieldValidation,
  validators?: Record<string, ValidatorFn>,
): string | null | undefined {
  if (!rules.validator) return undefined;
  return validators?.[rules.validator]?.(value, allValues);
}
