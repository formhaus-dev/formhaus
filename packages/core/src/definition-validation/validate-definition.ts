import { definitionErrors, routeFallthroughWarnings } from '../engine/step-routes';
import type { FormDefinition } from '../types';
import { analyzeDefinition } from './definition-analysis';
import { isEntry, shapeErrors } from './shape-errors';

function detectCycles(graph: Map<string, string[]>): string[][] {
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

export function validateDefinition(input: unknown): string[] {
  const shape = shapeErrors(input);
  if (shape.length) return shape;
  const definition = input as FormDefinition;
  const { graph, warnings } = analyzeDefinition(definition);
  if (!isEntry(definition.submit)) warnings.unshift('Form definition is missing the "submit" action.');
  for (const cycle of detectCycles(graph)) {
    warnings.push(`Circular show condition detected: ${cycle.join(' -> ')}`);
  }
  return [...definitionErrors(definition), ...warnings, ...routeFallthroughWarnings(definition)];
}
