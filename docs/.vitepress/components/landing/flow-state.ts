import type { FormDefinition } from '@formhaus/core';
import { nextStep, type FlowGraph } from './flow-graph';

export type NodeState = 'current' | 'visited' | 'skipped' | 'idle';
export type EdgeState = 'lit' | 'preview' | 'open' | 'dim' | 'idle';

export interface FlowInput {
  definition: FormDefinition;
  graph: FlowGraph;
  history: string[];
  values: Record<string, unknown>;
  done: boolean;
}

export interface FlowState {
  nodes: Record<string, NodeState>;
  edges: Record<string, EdgeState>;
  preview?: string;
  summary: string;
}

function answered(definition: FormDefinition, stepId: string, values: Record<string, unknown>): boolean {
  const step = definition.steps?.find((item) => item.id === stepId);
  return !!step?.fields.some((field) => {
    const value = values[field.key];
    return value !== undefined && value !== null && value !== '' && value !== false;
  });
}

export function flowState({ definition, graph, history, values, done }: FlowInput): FlowState {
  const current = history[history.length - 1];
  const preview = !done && current && answered(definition, current, values) ? nextStep(definition, current, values) : undefined;
  const chosen = new Map<string, string>();
  history.slice(0, -1).forEach((id, index) => chosen.set(id, history[index + 1]));
  if (current && preview) chosen.set(current, preview);
  const path = new Set([...history, ...(preview ? [preview] : [])]);
  const skipped = new Set<string>();
  for (const edge of graph.edges) {
    const pick = chosen.get(edge.from);
    if (pick && pick !== edge.to && !path.has(edge.to)) skipped.add(edge.to);
  }
  const nodes: Record<string, NodeState> = {};
  for (const node of graph.nodes) {
    if (done && history.includes(node.id)) nodes[node.id] = 'visited';
    else if (node.id === current) nodes[node.id] = 'current';
    else if (history.includes(node.id)) nodes[node.id] = 'visited';
    else if (skipped.has(node.id)) nodes[node.id] = 'skipped';
    else nodes[node.id] = 'idle';
  }
  const edges: Record<string, EdgeState> = {};
  for (const edge of graph.edges) {
    const pick = chosen.get(edge.from);
    if (pick === edge.to) edges[edge.id] = edge.from === current && !done ? 'preview' : 'lit';
    else if (pick || skipped.has(edge.from) || skipped.has(edge.to)) edges[edge.id] = 'dim';
    else if (edge.from === current && !done) edges[edge.id] = 'open';
    else edges[edge.id] = 'idle';
  }
  const stepLabel = (id: string) => graph.nodes.find((node) => node.id === id)?.label ?? id;
  const labels = history.map(stepLabel).join(', ');
  const summary = done
    ? `Submitted path: ${labels}.`
    : `Path so far: ${labels}.${preview ? ` Next: ${stepLabel(preview)}.` : ''}`;
  return { nodes, edges, preview, summary };
}
