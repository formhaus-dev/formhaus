import type { FieldValidation } from '../types';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { closest, error, oneOf, suggest, warning } from './issues';

const BUILT_IN_TYPES = ['text', 'email', 'phone', 'number', 'password', 'select', 'autocomplete', 'multiselect', 'checkbox', 'radio', 'switch', 'file', 'date', 'datetime', 'textarea'];
const CHOICE_TYPES = new Set(['select', 'radio', 'multiselect']);
const UNSIZED_TYPES = new Set(['number', 'checkbox', 'switch']);

function typeIssue({ field, path }: FieldEntry): DefinitionIssue[] {
  const match = BUILT_IN_TYPES.includes(field.type) ? undefined : closest(field.type, BUILT_IN_TYPES);
  if (match === undefined) return [];
  return [warning('unknown-field-type', `${path}/type`, `"${field.type}" is not a built-in field type`, `Use "${match}", or register a component for "${field.type}"`)];
}

function optionIssues({ field, path }: FieldEntry): DefinitionIssue[] {
  if (!CHOICE_TYPES.has(field.type)) return [];
  if (!Array.isArray(field.options)) {
    return field.optionsFrom ? [] : [warning('missing-options', `${path}/options`, `the ${field.type} field "${field.key}" has no options`, 'Add "options" or "optionsFrom"')];
  }
  const values = field.options.map((option) => option.value);
  const defaults = field.type === 'multiselect' && Array.isArray(field.defaultValue) ? field.defaultValue : [field.defaultValue];
  const missing = field.defaultValue === undefined || !values.length || field.optionsFrom ? undefined : defaults.find((value) => !values.includes(value as string));
  if (missing === undefined) return [];
  return [warning('default-not-in-options', `${path}/defaultValue`, `${JSON.stringify(missing)} is not an option of "${field.key}"`, oneOf(values))];
}

function rangeIssue(rules: FieldValidation, path: string, min: 'min' | 'minLength', max: 'max' | 'maxLength'): DefinitionIssue[] {
  const low = rules[min];
  const high = rules[max];
  if (low === undefined || high === undefined || low <= high) return [];
  return [error('invalid-range', `${path}/validation/${min}`, `${min} (${low}) is greater than ${max} (${high})`, `Lower ${min} or raise ${max}`)];
}

function applicableIssues({ field, path }: FieldEntry, rules: FieldValidation): DefinitionIssue[] {
  if (!BUILT_IN_TYPES.includes(field.type)) return [];
  const numeric = field.type === 'number';
  const names = numeric ? [] : (['min', 'max'] as const).filter((name) => rules[name] !== undefined);
  const sized = UNSIZED_TYPES.has(field.type) ? (['minLength', 'maxLength'] as const).filter((name) => rules[name] !== undefined) : [];
  return [
    ...names.map((name) => warning('rule-not-applicable', `${path}/validation/${name}`, `"${name}" applies to number fields only`, `Use ${name}Length to limit text length`)),
    ...sized.map((name) => warning('rule-not-applicable', `${path}/validation/${name}`, `"${name}" does not apply to ${field.type} fields`, numeric ? 'Use min and max for numbers' : `Remove ${name}`)),
  ];
}

function patternIssue(pattern: string | undefined, path: string): DefinitionIssue[] {
  if (pattern === undefined) return [];
  try {
    new RegExp(pattern);
    return [];
  } catch {
    return [error('invalid-pattern', `${path}/validation/pattern`, `${JSON.stringify(pattern)} is not a valid regular expression`, 'Fix the pattern or escape special characters with a backslash')];
  }
}

function ruleIssues(context: CheckContext, entry: FieldEntry): DefinitionIssue[] {
  const rules = entry.field.validation;
  if (!rules) return [];
  const { path } = entry;
  const issues = [
    ...rangeIssue(rules, path, 'minLength', 'maxLength'),
    ...rangeIssue(rules, path, 'min', 'max'),
    ...applicableIssues(entry, rules),
    ...patternIssue(rules.pattern, path),
  ];
  if (rules.matchField !== undefined && !context.keys.has(rules.matchField)) {
    issues.push(warning('unknown-field', `${path}/validation/matchField`, `"${rules.matchField}" is not a field key`, suggest(rules.matchField, context.keyList)));
  }
  const validators = context.validators;
  if (rules.validator !== undefined && validators && !Object.prototype.hasOwnProperty.call(validators, rules.validator)) {
    issues.push(warning('unknown-validator', `${path}/validation/validator`, `the validator "${rules.validator}" is not registered`, 'Pass it in the "validators" option'));
  }
  return issues;
}

function dependencyIssues(context: CheckContext, { field, path }: FieldEntry): DefinitionIssue[] {
  return (field.optionsDependsOn ?? []).flatMap((key, index) => (
    context.keys.has(key) ? [] : [warning('unknown-field', `${path}/optionsDependsOn/${index}`, `"${key}" is not a field key`, suggest(key, context.keyList))]
  ));
}

export function fieldIssues(context: CheckContext): DefinitionIssue[] {
  return context.entries.flatMap((entry) => [
    ...typeIssue(entry),
    ...optionIssues(entry),
    ...ruleIssues(context, entry),
    ...dependencyIssues(context, entry),
  ]);
}
