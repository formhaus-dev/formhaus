import { isGroup, isSection } from '../visibility/nodes';
import type { CheckContext, NodeEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error, oneOf } from './issues';
import { reachableSteps } from './paths';

const RESERVED = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);

function stepIssues({ definition }: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const steps = definition.steps ?? [];
  const seen = new Map<string, number>();
  steps.forEach((step, index) => {
    const first = seen.get(step.id);
    if (first === undefined) seen.set(step.id, index);
    else
      issues.push(
        error(
          'duplicate-step-id',
          `/steps/${index}/id`,
          `step id "${step.id}" is already used by /steps/${first}`,
          'Give each step a unique id',
        ),
      );
  });
  steps.forEach((step, index) => {
    (step.routes ?? []).forEach((route, position) => {
      if (route.to === null) return;
      const target = seen.get(route.to);
      if (target !== undefined && target > index) return;
      const later = steps.slice(index + 1).map((candidate) => candidate.id);
      const problem = target === undefined ? `"${route.to}" is not a step id` : `"${route.to}" is not a later step`;
      const hint = later.length ? `${oneOf(later)}, or null to end the form here` : 'Use null to end the form here';
      issues.push(error('route-target', `/steps/${index}/routes/${position}/to`, problem, hint));
    });
  });
  return issues;
}

function keyIssues({ definition, nodes }: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const reachable = reachableSteps(definition.steps ?? []);
  const exclusive = (a: NodeEntry, b: NodeEntry) => a.step !== b.step && !reachable[a.step]?.has(b.step);
  const outer = nodes.filter((entry) => !entry.group);
  const groups = outer.filter((entry) => isGroup(entry.node));
  nodes.forEach((entry, index) => {
    const {
      node: { key },
      path,
      group,
    } = entry;
    const clash = group
      ? (nodes.slice(0, index).find((other) => other.group === group && other.node.key === key) ??
        outer.find((other) => other.node.key === key))
      : outer.slice(0, outer.indexOf(entry)).find((other) => other.node.key === key && !exclusive(other, entry));
    const prefix = !group && groups.find((other) => key.startsWith(`${other.node.key}.`));
    if (RESERVED.has(key)) {
      issues.push(error('reserved-key', `${path}/key`, `"${key}" is a built-in object property name`, 'Rename the field key'));
    } else if (clash) {
      issues.push(
        error(
          'duplicate-key',
          `${path}/key`,
          `key "${key}" is already used by ${clash.path}${group ? '' : ' on the same path'}`,
          group ? 'Rename the field' : 'Rename one of the fields, or move them to route branches that never meet',
        ),
      );
    } else if (prefix) {
      issues.push(
        error('duplicate-key', `${path}/key`, `key "${key}" starts with the group key "${prefix.node.key}."`, 'Rename the field'),
      );
    }
  });
  return issues;
}

function nestingIssues({ nodes }: CheckContext): DefinitionIssue[] {
  return nodes.flatMap(({ node, path, group, parent }) =>
    (isSection(node) && parent) || (group && ['group', 'file', 'hidden'].includes(node.type))
      ? [error('invalid-nesting', `${path}/type`, `a ${node.type} cannot be inside a ${parent!.type}`, 'Move it to the fields of the step')]
      : [],
  );
}

export function structureIssues(context: CheckContext): DefinitionIssue[] {
  const { definition } = context;
  const both = !!definition.fields?.length && !!definition.steps?.length;
  return [
    ...(both
      ? [
          error(
            'fields-and-steps',
            '',
            'the definition has both "fields" and "steps"',
            'Move the top-level fields into a step, or remove "steps"',
          ),
        ]
      : []),
    ...stepIssues(context),
    ...keyIssues(context),
    ...nestingIssues(context),
  ];
}
