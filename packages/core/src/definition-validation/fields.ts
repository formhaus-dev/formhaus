import type { FieldValidation } from '../types';
import { SCALE_TYPES, scaleRange } from '../validation/type-checks';
import { missingTarget } from './conditions';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error } from './issues';
import { formatAtLeast } from './format';
import { isEntry, ruleShape } from './shape';

function rangeIssue(rules: FieldValidation, path: string, min: 'min' | 'minLength', max: 'max' | 'maxLength'): DefinitionIssue[] {
  const low = rules[min];
  const high = rules[max];
  if (low === undefined || high === undefined || low <= high) return [];
  return [error('min-greater-than-max', `${path}/validation/${min}`, min, low, max, high)];
}

function patternIssue(pattern: string | undefined, path: string): DefinitionIssue[] {
  if (pattern === undefined) return [];
  try {
    new RegExp(pattern);
    return [];
  } catch {
    return [error('invalid-pattern', `${path}/validation/pattern`, pattern)];
  }
}

function newerIssues({ field, path }: FieldEntry): DefinitionIssue[] {
  const { reorderable } = field as { reorderable?: unknown };
  return [
    ...ruleShape(field.readOnly, `${path}/readOnly`),
    ...(reorderable === undefined || typeof reorderable === 'boolean'
      ? []
      : [error('invalid-type', `${path}/reorderable`, 'boolean', 'reorderable')]),
    ...(Array.isArray(field.options) ? field.options : []).flatMap((option, index) => [
      ...(isEntry(option) ? ruleShape(option.disabled, `${path}/options/${index}/disabled`) : []),
      ...(option?.description === undefined || typeof option.description === 'string'
        ? []
        : [error('invalid-type', `${path}/options/${index}/description`, 'string', 'description')]),
    ]),
  ];
}

function ruleIssues(context: CheckContext, { field, path, group }: FieldEntry, files: boolean): DefinitionIssue[] {
  const rules = field.validation ?? {};
  const match = rules.matchField;
  const [min, max] = scaleRange(field);
  const items = field.type === 'group' ? (field as { defaultItems?: number }).defaultItems : undefined;
  return [
    ...(files && field.multiple !== undefined && typeof field.multiple !== 'boolean'
      ? [error('invalid-type', `${path}/multiple`, 'boolean', 'multiple')]
      : []),
    ...rangeIssue(rules, path, 'minLength', 'maxLength'),
    ...rangeIssue(rules, path, 'min', 'max'),
    ...patternIssue(rules.pattern, path),
    ...(SCALE_TYPES.includes(field.type) && !([min, max].every(Number.isInteger) && max > min && max - min < 11)
      ? [error('invalid-scale', `${path}/validation`)]
      : []),
    ...(match === undefined ? [] : missingTarget(context, match, `${path}/validation/matchField`, group?.key)),
    ...(items !== undefined && rules.maxLength !== undefined && items > rules.maxLength
      ? [error('default-items-greater-than-max', `${path}/defaultItems`, items, rules.maxLength)]
      : []),
  ];
}

function optionIssues({ field, path }: FieldEntry): DefinitionIssue[] {
  const seen = new Set<unknown>();
  return (field.options ?? []).flatMap(({ value }, index) =>
    seen.size === seen.add(value).size ? [error('duplicate-option-value', `${path}/options/${index}/value`, value)] : [],
  );
}

export function fieldIssues(context: CheckContext): DefinitionIssue[] {
  const files = formatAtLeast(context.definition, 7);
  const newer = formatAtLeast(context.definition, 8);
  return context.entries.flatMap((entry) => [
    ...ruleIssues(context, entry, files),
    ...optionIssues(entry),
    ...(newer ? newerIssues(entry) : []),
  ]);
}
