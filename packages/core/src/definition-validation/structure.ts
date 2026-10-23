import { isGroup, isSection } from '../visibility/nodes';
import type { CheckContext, NodeEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error } from './issues';
import { reachableSteps } from './paths';

const RESERVED = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);

function stepIssues({ definition }: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const steps = definition.steps ?? [];
  const seen = new Map<string, number>();
  steps.forEach((step, index) => {
    const first = seen.get(step.id);
    if (first === undefined) seen.set(step.id, index);
    else issues.push(error('duplicate-step-id', `/steps/${index}/id`, step.id, first));
  });
  steps.forEach((step, index) => {
    (step.routes ?? []).forEach((route, position) => {
      if (route.to === null) return;
      const target = seen.get(route.to);
      if (target !== undefined && target > index) return;
      const later = steps.slice(index + 1).map((candidate) => candidate.id);
      issues.push(error('route-target', `/steps/${index}/routes/${position}/to`, route.to, later, target !== undefined));
    });
  });
  return issues;
}

function keyIssues({ definition, nodes }: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const reachable = reachableSteps(definition.steps ?? []);
  const exclusive = (a: NodeEntry, b: NodeEntry) => a.step !== b.step && !reachable(a.step)?.has(b.step);
  const outer = nodes.filter((entry) => !entry.group);
  const groups = outer.filter((entry) => isGroup(entry.node));
  const firstOuter = new Map<string, NodeEntry>();
  for (const entry of outer) if (!firstOuter.has(entry.node.key)) firstOuter.set(entry.node.key, entry);
  const earlierOuter = new Map<string, NodeEntry[]>();
  const earlierInner = new Map<unknown, Map<string, NodeEntry>>();
  const earlier = (entry: NodeEntry): NodeEntry | undefined => {
    const { key } = entry.node;
    if (entry.group) {
      const seen = earlierInner.get(entry.group) ?? new Map<string, NodeEntry>();
      earlierInner.set(entry.group, seen);
      const clash = seen.get(key) ?? firstOuter.get(key);
      if (!seen.has(key)) seen.set(key, entry);
      return clash;
    }
    const seen = earlierOuter.get(key) ?? [];
    const clash = seen.find((other) => !exclusive(other, entry));
    earlierOuter.set(key, seen);
    seen.push(entry);
    return clash;
  };
  nodes.forEach((entry) => {
    const {
      node: { key },
      path,
      group,
    } = entry;
    const clash = earlier(entry);
    const prefix = !group && groups.find((other) => key.startsWith(`${other.node.key}.`));
    if (RESERVED.has(key)) {
      issues.push(error('reserved-key', `${path}/key`, key));
    } else if (clash) {
      issues.push(error('duplicate-key', `${path}/key`, key, clash.path, group ? 'group' : 'path'));
    } else if (prefix) {
      issues.push(error('duplicate-key', `${path}/key`, key, prefix.node.key, 'prefix'));
    }
  });
  return issues;
}

function nestingIssues({ nodes }: CheckContext): DefinitionIssue[] {
  return nodes.flatMap(({ node, path, group, parent }) =>
    (isSection(node) && parent) || (group && ['group', 'file', 'hidden'].includes(node.type))
      ? [error('invalid-nesting', `${path}/type`, node.type, parent!.type)]
      : [],
  );
}

export function structureIssues(context: CheckContext): DefinitionIssue[] {
  const { definition } = context;
  const both = !!definition.fields?.length && !!definition.steps?.length;
  return [...(both ? [error('fields-and-steps', '')] : []), ...stepIssues(context), ...keyIssues(context), ...nestingIssues(context)];
}
