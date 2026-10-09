import { isVisible, type FormDefinition, type FormStep } from '@formhaus/core';

export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  d: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  width: number;
  height: number;
}

export const NODE = { width: 104, height: 36 };
const GAP_X = 56;
const GAP_Y = 16;
const PAD = 2;

export function stepLabel(id: string): string {
  const words = id.replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function stepTargets(steps: FormStep[], index: number): string[] {
  const routes = steps[index].routes;
  if (routes?.length) {
    return [...new Set(routes.map((route) => route.to).filter((to): to is string => to !== null))];
  }
  const next = steps[index + 1];
  return next ? [next.id] : [];
}

export function nextStep(definition: FormDefinition, stepId: string, values: Record<string, unknown>): string | undefined {
  const steps = definition.steps ?? [];
  const index = steps.findIndex((step) => step.id === stepId);
  if (index < 0) return undefined;
  const routes = steps[index].routes;
  if (!routes?.length) return steps[index + 1]?.id;
  return routes.find((route) => isVisible(route, values))?.to ?? undefined;
}

function columns(steps: FormStep[]): string[][] {
  const depth = new Map<string, number>();
  steps.forEach((step, index) => {
    if (!depth.has(step.id)) depth.set(step.id, 0);
    for (const to of stepTargets(steps, index)) {
      depth.set(to, Math.max(depth.get(to) ?? 0, (depth.get(step.id) ?? 0) + 1));
    }
  });
  const result: string[][] = [];
  for (const step of steps) (result[depth.get(step.id) ?? 0] ??= []).push(step.id);
  return result.filter(Boolean);
}

function curve(from: FlowNode, to: FlowNode): string {
  const x1 = from.x + NODE.width;
  const y1 = from.y + NODE.height / 2;
  const x2 = to.x;
  const y2 = to.y + NODE.height / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

export function buildGraph(definition: FormDefinition): FlowGraph {
  const steps = definition.steps ?? [];
  if (!steps.length) {
    const label = definition.title || 'Form';
    return { nodes: [{ id: 'form', label, x: PAD, y: PAD }], edges: [], width: NODE.width + PAD * 2, height: NODE.height + PAD * 2 };
  }
  const cols = columns(steps);
  const rows = Math.max(1, ...cols.map((col) => col.length));
  const width = cols.length * NODE.width + (cols.length - 1) * GAP_X + PAD * 2;
  const height = rows * NODE.height + (rows - 1) * GAP_Y + PAD * 2;
  const byId = new Map<string, FlowNode>();
  const titles = new Map(steps.map((step) => [step.id, step.title || stepLabel(step.id)]));
  cols.forEach((col, c) => {
    const span = col.length * NODE.height + (col.length - 1) * GAP_Y;
    const top = PAD + (height - PAD * 2 - span) / 2;
    col.forEach((id, r) => {
      byId.set(id, { id, label: titles.get(id) ?? id, x: PAD + c * (NODE.width + GAP_X), y: top + r * (NODE.height + GAP_Y) });
    });
  });
  const edges: FlowEdge[] = [];
  steps.forEach((step, index) => {
    for (const to of stepTargets(steps, index)) {
      const a = byId.get(step.id);
      const b = byId.get(to);
      if (a && b) edges.push({ id: `${step.id}->${to}`, from: step.id, to, d: curve(a, b) });
    }
  });
  return { nodes: steps.map((step) => byId.get(step.id)!), edges, width, height };
}
