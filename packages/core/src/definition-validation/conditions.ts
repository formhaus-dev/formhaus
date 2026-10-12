import { CONDITION_OPERATORS } from '../visibility/evaluate-condition';
import type { ShowCondition } from '../types';
import type { CheckContext, ConditionEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error, pointer, suggest } from './issues';

export const OPERATORS: readonly string[] = CONDITION_OPERATORS;

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

function referenceIssues(context: CheckContext, { condition, path, owner, step, key }: ConditionEntry): DefinitionIssue[] {
  const target = context.keys.get(condition.field);
  if (!target) {
    const candidates = context.keyList.filter((candidate) => candidate !== key);
    return [error('unknown-field', `${path}/field`, `"${condition.field}" is not a field key`, suggest(condition.field, candidates))];
  }
  if (step < 0 || owner === 'action') return [];
  const sameStep = owner === 'step' ? 'this or a later step' : 'a later step';
  if (target.step < step || (owner !== 'step' && target.step === step)) return [];
  const allowed = owner === 'step' ? 'earlier steps' : 'this or an earlier step';
  return [error('forward-reference', `${path}/field`, `"${condition.field}" belongs to ${sameStep}`, `${owner === 'route' ? 'Route' : owner === 'step' ? 'Step' : 'Field'} conditions can use fields of ${allowed}`)];
}

export function conditionErrors(context: CheckContext, entry: ConditionEntry): DefinitionIssue[] {
  const { condition, path } = entry;
  if (typeof condition.field !== 'string') return [error('missing-property', `${path}/field`, 'the condition has no "field"', 'Add the key of the field to test')];
  return [...operatorIssues(condition, path), ...referenceIssues(context, entry)];
}

export function conditionIssues(context: CheckContext): DefinitionIssue[] {
  return context.conditions.flatMap((entry) => conditionErrors(context, entry));
}
