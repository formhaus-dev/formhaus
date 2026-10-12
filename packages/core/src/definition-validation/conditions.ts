import type { FormField, ShowCondition } from '../types';
import { CONDITION_OPERATORS } from '../visibility/evaluate-condition';
import type { CheckContext, ConditionEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error, oneOf, pointer, suggest, warning } from './issues';

const OPERATORS: readonly string[] = CONDITION_OPERATORS;
const LIST_OPERATORS = new Set(['in', 'notIn']);
const NEGATIONS = new Set(['neq', 'notIn']);
const COMPARISONS = new Set(['gt', 'gte', 'lt', 'lte']);
const STRING_TYPES = new Set(['text', 'email', 'phone', 'password', 'textarea', 'date', 'datetime', 'select', 'radio', 'autocomplete']);
const BOOLEAN_TYPES = new Set(['checkbox', 'switch']);

function expectedType(field: FormField): string | undefined {
  if (field.type === 'number') return 'number';
  if (BOOLEAN_TYPES.has(field.type)) return 'boolean';
  return STRING_TYPES.has(field.type) ? 'string' : undefined;
}

function comparisonIssue(target: FormField, operator: string, path: string): DefinitionIssue | undefined {
  if (target.type !== 'multiselect' && !BOOLEAN_TYPES.has(target.type)) return undefined;
  return warning('condition-value-mismatch', path, `"${target.key}" is a ${target.type} field, so "${operator}" never matches it`, 'Compare a number, text, radio or select field');
}

function valueIssue(target: FormField, operator: string, operand: unknown, path: string): DefinitionIssue | undefined {
  if (operator === 'notEmpty') return undefined;
  if (COMPARISONS.has(operator)) return comparisonIssue(target, operator, path);
  if (target.type === 'multiselect') {
    const result = NEGATIONS.has(operator) ? 'always' : 'never';
    return warning('condition-value-mismatch', path, `"${target.key}" holds a list of values, so "${operator}" ${result} matches it`, 'Use notEmpty, or a select or radio field');
  }
  const operands = LIST_OPERATORS.has(operator) && Array.isArray(operand) ? operand : [operand];
  const expected = expectedType(target);
  const wrong = expected && operands.find((item) => typeof item !== expected);
  if (expected && wrong !== undefined) {
    return warning('condition-value-mismatch', path, `${JSON.stringify(wrong)} is a ${typeof wrong}, but "${target.key}" holds a ${expected}`, `Use a ${expected} value`);
  }
  const options = expected === 'string' && !target.optionsFrom && target.options?.length ? target.options.map((option) => option.value) : null;
  const missing = options && operands.find((item) => !options.includes(item as string));
  if (options && missing !== undefined) {
    return warning('condition-value-mismatch', path, `${JSON.stringify(missing)} is not an option of "${target.key}"`, oneOf(options));
  }
  return undefined;
}

function operatorIssues(condition: ShowCondition, path: string): DefinitionIssue[] {
  const keys = Object.keys(condition).filter((key) => key !== 'field');
  const unknown = keys.filter((key) => !OPERATORS.includes(key));
  const issues = unknown.map((key) => error('unknown-operator', `${path}/${pointer(key)}`, `"${key}" is not a condition operator`, suggest(key, [...OPERATORS])));
  const count = keys.length - unknown.length;
  if (count !== 1 && !(count === 0 && unknown.length)) {
    const problem = count ? `the condition has ${count} operators` : 'the condition has no operator';
    issues.push(error('condition-operator-count', path, problem, `Use exactly one of: ${OPERATORS.join(', ')}`));
  }
  return issues;
}

function referenceIssue(context: CheckContext, { condition, path, owner, step, key }: ConditionEntry): DefinitionIssue | undefined {
  const target = context.keys.get(condition.field);
  if (!target) {
    const report = owner === 'route' ? error : warning;
    const candidates = context.keyList.filter((candidate) => candidate !== key);
    return report('unknown-field', `${path}/field`, `"${condition.field}" is not a field key`, suggest(condition.field, candidates));
  }
  if (!context.routed || target.step < step || (owner === 'route' && target.step === step)) return undefined;
  if (owner === 'route') {
    return error('forward-reference', `${path}/field`, `"${condition.field}" belongs to a later step`, 'Route conditions can use fields of this or an earlier step');
  }
  if (owner !== 'step') return undefined;
  return warning('forward-reference', `${path}/field`, `"${condition.field}" belongs to this or a later step`, 'Step conditions can use fields of earlier steps');
}

export function conditionIssues(context: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  for (const entry of context.conditions) {
    const { condition, path } = entry;
    if (typeof condition.field !== 'string') {
      issues.push(error('missing-property', `${path}/field`, 'the condition has no "field"', 'Add the key of the field to test'));
      continue;
    }
    const operators = operatorIssues(condition, path);
    issues.push(...operators);
    const reference = referenceIssue(context, entry);
    if (reference) issues.push(reference);
    const target = context.keys.get(condition.field);
    const operator = OPERATORS.find((key) => key in condition);
    if (!reference && !operators.length && target && operator) {
      const mismatch = valueIssue(target.field, operator, condition[operator as keyof ShowCondition], `${path}/${operator}`);
      if (mismatch) issues.push(mismatch);
    }
  }
  return issues;
}
