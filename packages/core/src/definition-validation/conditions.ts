import { CONDITION_OPERATORS } from '../visibility/evaluate-condition';
import type { ShowCondition } from '../types';
import type { CheckContext, ConditionEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error, pointer } from './issues';

export const OPERATORS: readonly string[] = CONDITION_OPERATORS;
export const CONTAINS = ['contains', 'notContains'];

function operatorIssues({ suggest }: CheckContext, condition: ShowCondition, path: string): DefinitionIssue[] {
  const keys = Object.keys(condition).filter((key) => key !== 'field');
  const unknown = keys.filter((key) => !OPERATORS.includes(key));
  const issues = unknown.map((key) =>
    error('unknown-operator', `${path}/${pointer(key)}`, `"${key}" is not a condition operator`, suggest(key, [...OPERATORS])),
  );
  const count = keys.length - unknown.length;
  if (count !== 1 && !(count === 0 && unknown.length)) {
    const problem = count ? `the condition has ${count} operators` : 'the condition has no operator';
    issues.push(error('condition-operator-count', path, problem, `Use exactly one of: ${OPERATORS.join(', ')}`));
  }
  return issues;
}

export function missingTarget(context: CheckContext, name: string, path: string, group?: string, key?: string): DefinitionIssue[] {
  if (context.target(name, group)) return [];
  const inner = [...context.scopes].find(([, scope]) => scope.has(name));
  if (inner)
    return [error('group-scope', path, `"${name}" is a field inside the group "${inner[0]}"`, 'Only fields of the same group can use it')];
  const candidates = [...(group !== undefined ? (context.scopes.get(group)?.keys() ?? []) : []), ...context.keyList].filter(
    (candidate) => candidate !== key,
  );
  return [error('unknown-field', path, `"${name}" is not a field key`, context.suggest(name, candidates))];
}

function referenceIssues(context: CheckContext, { condition, path, owner, step, key, group }: ConditionEntry): DefinitionIssue[] {
  const target = context.target(condition.field, group);
  if (!target) return missingTarget(context, condition.field, `${path}/field`, group, key);
  if (target.group || step < 0 || owner === 'action') return [];
  const sameStep = owner === 'step' ? 'this or a later step' : 'a later step';
  if (target.step < step || (owner !== 'step' && target.step === step)) return [];
  const allowed = owner === 'step' ? 'earlier steps' : 'this or an earlier step';
  return [
    error(
      'forward-reference',
      `${path}/field`,
      `"${condition.field}" belongs to ${sameStep}`,
      `${owner === 'route' ? 'Route' : owner === 'step' ? 'Step' : 'Field'} conditions can use fields of ${allowed}`,
    ),
  ];
}

export function conditionErrors(context: CheckContext, entry: ConditionEntry): DefinitionIssue[] {
  const { condition, path } = entry;
  if (typeof condition.field !== 'string')
    return [error('missing-property', path, 'missing required property "field"', 'Add the key of the field to test')];
  return [...operatorIssues(context, condition, path), ...referenceIssues(context, entry)];
}

export function conditionIssues(context: CheckContext): DefinitionIssue[] {
  return context.conditions.flatMap((entry) => conditionErrors(context, entry));
}
