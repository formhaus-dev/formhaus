import type { FieldValidation } from '../types';
import { missingTarget } from './conditions';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error } from './issues';

function rangeIssue(rules: FieldValidation, path: string, min: 'min' | 'minLength', max: 'max' | 'maxLength'): DefinitionIssue[] {
  const low = rules[min];
  const high = rules[max];
  if (low === undefined || high === undefined || low <= high) return [];
  return [
    error('invalid-range', `${path}/validation/${min}`, `${min} (${low}) is greater than ${max} (${high})`, `Lower ${min} or raise ${max}`),
  ];
}

function patternIssue(pattern: string | undefined, path: string): DefinitionIssue[] {
  if (pattern === undefined) return [];
  try {
    new RegExp(pattern);
    return [];
  } catch {
    return [
      error(
        'invalid-pattern',
        `${path}/validation/pattern`,
        `${JSON.stringify(pattern)} is not a valid regular expression`,
        'Fix the pattern or escape special characters with a backslash',
      ),
    ];
  }
}

function ruleIssues(context: CheckContext, { field, path, group }: FieldEntry): DefinitionIssue[] {
  const rules = field.validation ?? {};
  const match = rules.matchField;
  const items = field.type === 'group' ? (field as { defaultItems?: number }).defaultItems : undefined;
  return [
    ...rangeIssue(rules, path, 'minLength', 'maxLength'),
    ...rangeIssue(rules, path, 'min', 'max'),
    ...patternIssue(rules.pattern, path),
    ...(match === undefined ? [] : missingTarget(context, match, `${path}/validation/matchField`, group?.key)),
    ...(items !== undefined && rules.maxLength !== undefined && items > rules.maxLength
      ? [
          error(
            'invalid-range',
            `${path}/defaultItems`,
            `defaultItems (${items}) is greater than maxLength (${rules.maxLength})`,
            'Lower defaultItems or raise maxLength',
          ),
        ]
      : []),
  ];
}

export function fieldIssues(context: CheckContext): DefinitionIssue[] {
  return context.entries.flatMap((entry) => ruleIssues(context, entry));
}
