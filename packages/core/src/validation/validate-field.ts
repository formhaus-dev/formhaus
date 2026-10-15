import type { FieldValidation, FormField } from '../types';
import { isBlank } from '../visibility';
import { messageResolver, type MessageSource, type ResolveMessage } from './default-messages';
import { BOOLEAN_TYPES, clientTypeError, trimValue } from './type-checks';

export type ValidatorFn = (
  value: unknown,
  allValues: Record<string, unknown>,
) => string | null;


function isEmpty(value: unknown, field: FormField): boolean {
  return isBlank(value) || (value === false && BOOLEAN_TYPES.includes(field.type));
}

function boundError(
  size: number,
  rule: 'Length' | '',
  rules: FieldValidation,
  message: (key: 'min' | 'max', params: Record<string, number>) => string,
): string | undefined {
  const min = rules[`min${rule}`];
  const max = rules[`max${rule}`];
  if (min !== undefined && size < min) return rules[`min${rule}Message`] ?? message('min', { min });
  if (max !== undefined && size > max) return rules[`max${rule}Message`] ?? message('max', { max });
  return undefined;
}

function patternError(value: unknown, rules: FieldValidation, message: () => string): string | undefined {
  if (rules.pattern === undefined) return undefined;
  try {
    return new RegExp(rules.pattern).test(String(value)) ? undefined : rules.patternMessage ?? message();
  } catch {
    return undefined;
  }
}

function sizeError(value: unknown, rules: FieldValidation, field: FormField, resolve: ResolveMessage): string | undefined {
  if (typeof value === 'number') return boundError(value, '', rules, (key, params) => resolve(key, params, field));
  if (typeof value !== 'string' && !Array.isArray(value)) return undefined;
  const unit = Array.isArray(value) ? 'Items' : 'Length';
  return boundError(value.length, 'Length', rules, (key, params) => resolve(`${key}${unit}`, params, field));
}

export function validateFieldValue(
  field: FormField,
  input: unknown,
  allValues: Record<string, unknown>,
  validators?: Record<string, ValidatorFn>,
  messages?: MessageSource,
): string | null {
  const value = trimValue(field, input);
  const rules = field.validation ?? {};
  const resolve = messageResolver(messages);
  const matchMessage = () => rules.matchFieldMessage ?? resolve('matchField', {}, field);
  if (isEmpty(value, field)) {
    if (rules.required) return typeof rules.required === 'string' ? rules.required : resolve('required', {}, field);
    return rules.matchField !== undefined && !isBlank(allValues[rules.matchField]) ? matchMessage() : null;
  }
  const typeIssue = clientTypeError(field, value, resolve);
  if (typeIssue) return typeIssue;
  return (sizeError(value, rules, field, resolve)
    ?? patternError(value, rules, () => resolve('pattern', {}, field))
    ?? (rules.matchField !== undefined && value !== allValues[rules.matchField] ? matchMessage() : undefined)
    ?? (rules.validator ? validators?.[rules.validator]?.(value, allValues) : undefined)) || null;
}
