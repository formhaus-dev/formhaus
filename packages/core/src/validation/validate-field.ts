import type { FieldValidation, FormField } from '../types';
import { isBlank } from '../visibility';
import { messageResolver, namedResolver, type MessageSource, type ResolveMessage } from './default-messages';
import { BOOLEAN_TYPES, clientTypeError, exclusiveValues, MAX_STRING_LENGTH, trimValue } from './type-checks';

export type ValidatorFn = (value: unknown, allValues: Record<string, unknown>) => string | null;

export interface ValidateOptions {
  validators?: Record<string, ValidatorFn>;
  messages?: MessageSource;
}

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

const patterns = new Map<string, RegExp | null>();
const MAX_PATTERN_TESTS = 10_000;
let patternTests: number | undefined;

type PatternLimit = (pattern: string) => number | undefined;
let patternLimit: PatternLimit | undefined;

export function withPatternBudget<T>(run: () => T, limit = patternLimit): T {
  const outer = patternLimit;
  const opened = patternTests === undefined;
  if (opened) patternTests = 0;
  patternLimit = limit;
  try {
    return run();
  } finally {
    patternLimit = outer;
    if (opened) patternTests = undefined;
  }
}

function compile(source: string): RegExp | null {
  const cached = typeof source === 'string' ? patterns.get(source) : undefined;
  if (cached !== undefined) return cached;
  let pattern: RegExp | null = null;
  try {
    pattern = new RegExp(source);
  } catch {}
  if (typeof source !== 'string') return pattern;
  if (patterns.size >= 256) patterns.clear();
  patterns.set(source, pattern);
  return pattern;
}

function patternError(value: unknown, rules: FieldValidation, message: () => string): string | undefined {
  if (rules.pattern === undefined) return undefined;
  const pattern = compile(rules.pattern);
  if (!pattern) return undefined;
  let matches = false;
  try {
    const text = String(value);
    const allowed =
      text.length <= (patternLimit?.(rules.pattern) ?? MAX_STRING_LENGTH) &&
      (patternTests === undefined || patternTests++ < MAX_PATTERN_TESTS);
    matches = allowed && pattern.test(text);
  } catch {}
  return matches ? undefined : (rules.patternMessage ?? message());
}

function sizeError(value: unknown, rules: FieldValidation, field: FormField, resolve: ResolveMessage): string | undefined {
  if (typeof value === 'number') return boundError(value, '', rules, (key, params) => resolve(key, params, field));
  if (typeof value !== 'string' && !Array.isArray(value)) return undefined;
  const unit = Array.isArray(value) ? 'Items' : 'Length';
  const exclusive = Array.isArray(value) && value.length === 1 && exclusiveValues(field).includes(value[0]);
  const bounds = exclusive ? { ...rules, minLength: undefined } : rules;
  return boundError(value.length, 'Length', bounds, (key, params) => resolve(`${key}${unit}`, params, field));
}

export function validateFieldValue(
  field: FormField,
  input: unknown,
  allValues: Record<string, unknown>,
  { validators, messages }: ValidateOptions = {},
): string | null {
  const value = trimValue(field, input);
  const rules = field.validation ?? {};
  const resolve = namedResolver(messageResolver(messages));
  const matchMessage = () => rules.matchFieldMessage ?? resolve('matchField', {}, field);
  if (isEmpty(value, field)) {
    if (rules.required) return typeof rules.required === 'string' ? rules.required : resolve('required', {}, field);
    return rules.matchField !== undefined && !isBlank(allValues[rules.matchField]) ? matchMessage() : null;
  }
  const typeIssue = clientTypeError(field, value, resolve);
  if (typeIssue) return typeIssue;
  return (
    (sizeError(value, rules, field, resolve) ??
      patternError(value, rules, () => resolve('pattern', {}, field)) ??
      (rules.matchField !== undefined && value !== allValues[rules.matchField] ? matchMessage() : undefined) ??
      (rules.validator ? validators?.[rules.validator]?.(value, allValues) : undefined)) ||
    null
  );
}
