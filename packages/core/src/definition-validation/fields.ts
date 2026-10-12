import type { FieldValidation } from '../types';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error } from './issues';

function rangeIssue(rules: FieldValidation, path: string, min: 'min' | 'minLength', max: 'max' | 'maxLength'): DefinitionIssue[] {
  const low = rules[min];
  const high = rules[max];
  if (low === undefined || high === undefined || low <= high) return [];
  return [error('invalid-range', `${path}/validation/${min}`, `${min} (${low}) is greater than ${max} (${high})`, `Lower ${min} or raise ${max}`)];
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

function ruleIssues(context: CheckContext, { field, path }: FieldEntry): DefinitionIssue[] {
  const rules = field.validation;
  if (!rules) return [];
  const match = rules.matchField;
  return [
    ...rangeIssue(rules, path, 'minLength', 'maxLength'),
    ...rangeIssue(rules, path, 'min', 'max'),
    ...patternIssue(rules.pattern, path),
    ...(match === undefined || context.keys.has(match) ? [] : [error('unknown-field', `${path}/validation/matchField`, `"${match}" is not a field key`, context.suggest(match, context.keyList))]),
  ];
}

export function fieldIssues(context: CheckContext): DefinitionIssue[] {
  return context.entries.flatMap((entry) => ruleIssues(context, entry));
}
