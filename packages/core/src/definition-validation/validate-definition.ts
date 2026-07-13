import type { FormDefinition } from '../types';
import { analyzeDefinition } from './definition-analysis';

function detectCycles(graph: Map<string, string[]>): string[][] {
  const state = new Map<string, 'visiting' | 'visited'>();
  const cycles: string[][] = [];

  for (const start of graph.keys()) {
    if (state.has(start)) continue;

    const path: string[] = [];
    const stack: { node: string; nextNeighbor: number }[] = [
      { node: start, nextNeighbor: 0 },
    ];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (!state.has(frame.node)) {
        state.set(frame.node, 'visiting');
        path.push(frame.node);
      }

      const neighbors = graph.get(frame.node) ?? [];
      if (frame.nextNeighbor < neighbors.length) {
        const neighbor = neighbors[frame.nextNeighbor++];
        const neighborState = state.get(neighbor);

        if (neighborState === 'visiting') {
          const cycleStart = path.indexOf(neighbor);
          cycles.push([...path.slice(cycleStart), neighbor]);
        } else if (neighborState !== 'visited') {
          stack.push({ node: neighbor, nextNeighbor: 0 });
        }
        continue;
      }

      state.set(frame.node, 'visited');
      path.pop();
      stack.pop();
    }
  }

  return cycles;
}

export function validateDefinition(definition: FormDefinition): string[] {
  const { graph, warnings } = analyzeDefinition(definition);
  const hasFields = (definition.fields?.length ?? 0) > 0;
  const hasSteps = (definition.steps?.length ?? 0) > 0;
  if (hasFields && hasSteps) {
    warnings.unshift('Definition has both "fields" and "steps". Only "steps" will be used.');
  }
  for (const cycle of detectCycles(graph)) {
    warnings.push(`Circular show condition detected: ${cycle.join(' -> ')}`);
  }
  return warnings;
}
