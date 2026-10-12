import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { error } from './issues';

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

export function graphIssues(context: CheckContext): DefinitionIssue[] {
  return cycleIssues(context);
}
