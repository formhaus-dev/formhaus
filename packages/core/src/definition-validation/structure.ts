import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { error, oneOf, warning } from './issues';

const RESERVED = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);

function stepIssues({ definition }: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const steps = definition.steps ?? [];
  const seen = new Map<string, number>();
  steps.forEach((step, index) => {
    const first = seen.get(step.id);
    if (first === undefined) seen.set(step.id, index);
    else issues.push(error('duplicate-step-id', `/steps/${index}/id`, `step id "${step.id}" is already used by /steps/${first}`, 'Give each step a unique id'));
  });
  steps.forEach((step, index) => (step.routes ?? []).forEach((route, position) => {
    if (route.to === null) return;
    const target = seen.get(route.to);
    if (target !== undefined && target > index) return;
    const later = steps.slice(index + 1).map((candidate) => candidate.id);
    const problem = target === undefined ? `"${route.to}" is not a step id` : `"${route.to}" is not a later step`;
    const hint = later.length ? `${oneOf(later)}, or null to end the form here` : 'Use null to end the form here';
    issues.push(error('route-target', `/steps/${index}/routes/${position}/to`, problem, hint));
  }));
  return issues;
}

function keyIssues({ entries, keys }: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  for (const { field, path } of entries) {
    const first = keys.get(field.key)!;
    if (RESERVED.has(field.key)) {
      issues.push(error('reserved-key', `${path}/key`, `"${field.key}" is a built-in object property name`, 'Rename the field key'));
    } else if (first.path !== path) {
      issues.push(warning('duplicate-key', `${path}/key`, `key "${field.key}" is already used by ${first.path}`, 'Give each field a unique key, because fields with one key share one value'));
    }
  }
  return issues;
}

export function structureIssues(context: CheckContext): DefinitionIssue[] {
  const { definition } = context;
  const both = !!definition.fields?.length && !!definition.steps?.length;
  return [
    ...(both ? [error('fields-and-steps', '', 'the definition has both "fields" and "steps"', 'Move the top-level fields into a step, or remove "steps"')] : []),
    ...stepIssues(context),
    ...keyIssues(context),
  ];
}
