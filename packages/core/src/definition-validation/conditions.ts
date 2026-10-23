import { CONDITION_OPERATORS } from '../visibility/evaluate-condition';
import type { ShowCondition } from '../types';
import type { CheckContext, ConditionEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error, pointer } from './issues';

export const OPERATORS: readonly string[] = CONDITION_OPERATORS;
export const CONTAINS = ['contains', 'notContains'];

function operatorIssues(condition: ShowCondition, path: string): DefinitionIssue[] {
  const keys = Object.keys(condition).filter((key) => key !== 'field');
  const unknown = keys.filter((key) => !OPERATORS.includes(key));
  const issues = unknown.map((key) => error('unknown-operator', `${path}/${pointer(key)}`, key));
  const count = keys.length - unknown.length;
  if (count !== 1 && !(count === 0 && unknown.length)) issues.push(error('condition-operator-count', path, count));
  return issues;
}

export function missingTarget(context: CheckContext, name: string, path: string, group?: string, key?: string): DefinitionIssue[] {
  if (context.target(name, group)) return [];
  const inner = [...context.scopes].find(([, scope]) => scope.has(name));
  if (inner) return [error('group-scope', path, name, inner[0])];
  const candidates = [...(group !== undefined ? (context.scopes.get(group)?.keys() ?? []) : []), ...context.keyList].filter(
    (candidate) => candidate !== key,
  );
  return [error('unknown-field', path, name, candidates)];
}

function referenceIssues(context: CheckContext, { condition, path, owner, step, key, group }: ConditionEntry): DefinitionIssue[] {
  const target = context.target(condition.field, group);
  if (!target) return missingTarget(context, condition.field, `${path}/field`, group, key);
  if (target.group || step < 0 || owner === 'action') return [];
  if (target.step < step || (owner !== 'step' && target.step === step)) return [];
  return [error('forward-reference', `${path}/field`, condition.field, owner)];
}

export function conditionErrors(context: CheckContext, entry: ConditionEntry): DefinitionIssue[] {
  const { condition, path } = entry;
  if (typeof condition.field !== 'string') return [error('missing-property', path, 'field')];
  return [...operatorIssues(condition, path), ...referenceIssues(context, entry)];
}

export function conditionIssues(context: CheckContext): DefinitionIssue[] {
  return context.conditions.flatMap((entry) => conditionErrors(context, entry));
}
