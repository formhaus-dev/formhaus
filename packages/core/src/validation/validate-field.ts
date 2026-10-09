import type { FieldValidation, FormField } from '../types';
import { getDefaultMessage } from './default-messages';

export type ValidatorFn = (
  value: unknown,
  allValues: Record<string, unknown>,
) => string | null;

const BOOLEAN_TYPES = new Set(['checkbox', 'switch']);

function isEmpty(value: unknown, field: FormField): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (value === false && BOOLEAN_TYPES.has(field.type)) return true;
  return Array.isArray(value) && value.length === 0;
}

function boundError(
  size: number,
  rule: 'Length' | '',
  rules: FieldValidation,
  unit?: string,
): string | undefined {
  const min = rules[`min${rule}`];
  const max = rules[`max${rule}`];
  if (min !== undefined && size < min) return rules[`min${rule}Message`] ?? getDefaultMessage(`min${rule}`, { min, unit });
  if (max !== undefined && size > max) return rules[`max${rule}Message`] ?? getDefaultMessage(`max${rule}`, { max, unit });
  return undefined;
}

function patternError(value: unknown, rules: FieldValidation): string | undefined {
  if (rules.pattern === undefined) return undefined;
  try {
    return new RegExp(rules.pattern).test(String(value)) ? undefined : rules.patternMessage ?? getDefaultMessage('pattern');
  } catch {
    return undefined;
  }
}

export function validateField(
  field: FormField,
  value: unknown,
  allValues: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
): string | null {
  const rules = field.validation;
  if (!rules) return null;
  if (isEmpty(value, field)) {
    if (!rules.required) return null;
    return typeof rules.required === 'string' ? rules.required : getDefaultMessage('required');
  }
  const sizeError = typeof value === 'string' || Array.isArray(value)
    ? boundError(value.length, 'Length', rules, Array.isArray(value) ? 'items' : undefined)
    : typeof value === 'number' ? boundError(value, '', rules) : undefined;
  const matchError = rules.matchField !== undefined && value !== allValues[rules.matchField]
    ? rules.matchFieldMessage ?? getDefaultMessage('matchField')
    : undefined;
  return sizeError
    ?? patternError(value, rules)
    ?? matchError
    ?? (rules.validator ? validators?.[rules.validator]?.(value, allValues) : undefined)
    ?? null;
}
