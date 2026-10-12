import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { error, warning } from './issues';

function dependencyGraph({ definition, entries, keys }: CheckContext): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const link = (owners: string[], dependencies: string[]) => {
    const known = dependencies.filter((key) => keys.has(key));
    if (known.length) for (const owner of owners) graph.set(owner, [...(graph.get(owner) ?? []), ...known]);
  };
  const fieldsOf = (source: { show?: { field: string }[]; showAny?: { field: string }[] }) => (
    [...(source.show ?? []), ...(source.showAny ?? [])].map((condition) => condition.field)
  );
  for (const { field } of entries) link([field.key], fieldsOf(field));
  for (const step of definition.steps ?? []) link(step.fields.map((field) => field.key), fieldsOf(step));
  return graph;
}

function findCycles(graph: Map<string, string[]>): string[][] {
  const visiting = new Map<string, boolean>();
  const cycles: string[][] = [];
  for (const start of graph.keys()) {
    if (visiting.has(start)) continue;
    visiting.set(start, true);
    const stack: [string, number][] = [[start, 0]];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const neighbor = graph.get(frame[0])?.[frame[1]++];
      if (neighbor === undefined) {
        visiting.set(frame[0], false);
        stack.pop();
      } else if (visiting.get(neighbor)) {
        const nodes = stack.map(([node]) => node);
        cycles.push([...nodes.slice(nodes.indexOf(neighbor)), neighbor]);
      } else if (!visiting.has(neighbor)) {
        visiting.set(neighbor, true);
        stack.push([neighbor, 0]);
      }
    }
  }
  return cycles;
}

function cycleIssues(context: CheckContext): DefinitionIssue[] {
  return findCycles(dependencyGraph(context)).map((cycle) => (
    error('condition-cycle', context.keys.get(cycle[0])!.path, `show conditions form a cycle: ${cycle.join(' -> ')}`, 'Remove one of the conditions in the cycle')
  ));
}

function fallthroughIssues({ definition }: CheckContext): DefinitionIssue[] {
  const steps = definition.steps ?? [];
  const issues: DefinitionIssue[] = [];
  steps.forEach((step, index) => {
    const targets = new Set((step.routes ?? []).map((route) => route.to).filter((to) => to !== null));
    for (const target of targets) {
      const position = steps.findIndex((candidate) => candidate.id === target);
      const sibling = steps[position + 1];
      const exits = steps[position]?.routes?.some((route) => !route.show?.length && !route.showAny?.length);
      if (!sibling || !targets.has(sibling.id) || exits) continue;
      issues.push(warning('route-fallthrough', `/steps/${position}`, `branch "${target}" from "${step.id}" continues into the sibling branch "${sibling.id}"`, `Add an unconditional route on "${target}" to the step where the branches meet`));
    }
    if (step.skip && (step.next === false || !steps[1])) {
      issues.push(warning('skip-unreachable', `/steps/${index}/skip`, `step "${step.id}" has "skip" but no Continue button or later step`, 'Remove "skip", or remove "next": false'));
    }
  });
  return issues;
}

export function graphIssues(context: CheckContext): DefinitionIssue[] {
  return [...cycleIssues(context), ...fallthroughIssues(context)];
}
