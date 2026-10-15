import type { FormNode } from '../types';
import { isSection, valueFields } from '../visibility/nodes';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error } from './issues';

const nodeId = ({ field, group }: FieldEntry) => (group ? `${group.key}.${field.key}` : field.key);

function dependencyGraph({ definition, entries, nodes, target }: CheckContext): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const link = (owners: string[], source: FormNode | { show?: { field: string }[]; showAny?: { field: string }[] }, group?: string) => {
    const known = [...(source.show ?? []), ...(source.showAny ?? [])].flatMap(({ field }) => {
      const entry = target(field, group);
      return entry ? [nodeId(entry)] : [];
    });
    if (known.length) for (const owner of owners) graph.set(owner, [...(graph.get(owner) ?? []), ...known]);
  };
  for (const entry of entries) link([nodeId(entry)], entry.field, entry.group?.key);
  for (const { node, group } of nodes)
    if (isSection(node) && !group)
      link(
        node.fields.map((field) => field.key),
        node,
      );
  for (const step of definition.steps ?? [])
    link(
      valueFields(step.fields).map((field) => field.key),
      step,
    );
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
  const paths = new Map(context.entries.map((entry) => [nodeId(entry), entry.path]));
  return findCycles(dependencyGraph(context)).map((cycle) =>
    error(
      'condition-cycle',
      paths.get(cycle[0])!,
      `show conditions form a cycle: ${cycle.join(' -> ')}`,
      'Remove one of the conditions in the cycle',
    ),
  );
}

export function graphIssues(context: CheckContext): DefinitionIssue[] {
  return cycleIssues(context);
}
