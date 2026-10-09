import { routeFallthroughWarnings, routeWarnings } from '../engine/step-routes';
import { hasFieldsAndSteps } from '../engine/engine-utils';
import type { FormDefinition } from '../types';
import { analyzeDefinition } from './definition-analysis';

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

export function validateDefinition(definition: FormDefinition): string[] {
  const { graph, warnings } = analyzeDefinition(definition);
  if (hasFieldsAndSteps(definition)) {
    warnings.unshift('Definition has both "fields" and "steps". Only "steps" will be used.');
  }
  for (const cycle of detectCycles(graph)) {
    warnings.push(`Circular show condition detected: ${cycle.join(' -> ')}`);
  }
  return [...warnings, ...routeWarnings(definition), ...routeFallthroughWarnings(definition)];
}
