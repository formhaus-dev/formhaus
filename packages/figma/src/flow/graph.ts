import type { FormDefinition, FormField, FormStep, ShowCondition } from '@formhaus/core';

export interface FlowEdge {
  from: string;
  to: string | null;
  label: string;
}

export interface FlowGraph {
  branching: boolean;
  depth: Map<string, number>;
  edges: FlowEdge[];
}

function fieldsByKey(steps: FormStep[]): Map<string, FormField> {
  return new Map(steps.flatMap((step) => step.fields.map((field) => [field.key, field] as const)));
}

function valueText(field: FormField | undefined, value: unknown): string {
  return field?.options?.find((option) => option.value === String(value))?.label ?? String(value);
}

export function describeCondition(condition: ShowCondition, fields: Map<string, FormField>): string {
  const field = fields.get(condition.field);
  const name = field?.label ?? condition.field;
  const list = (values: (string | number)[]) => values.map((value) => valueText(field, value)).join(' or ');
  if (condition.eq !== undefined) return `${name} is ${valueText(field, condition.eq)}`;
  if (condition.neq !== undefined) return `${name} is not ${valueText(field, condition.neq)}`;
  if (condition.in) return `${name} is ${list(condition.in)}`;
  if (condition.notIn) return `${name} is not ${list(condition.notIn)}`;
  return condition.notEmpty ? `${name} is filled` : '';
}

export function describeConditions(owner: { show?: ShowCondition[]; showAny?: ShowCondition[] }, fields: Map<string, FormField>): string {
  const describe = (conditions: ShowCondition[] = [], joiner: string) => conditions.map((condition) => describeCondition(condition, fields)).filter(Boolean).join(joiner);
  const all = describe(owner.show, ' and ');
  const anyConditions = owner.showAny ?? [];
  const any = anyConditions.every((condition) => describeCondition(condition, fields)) ? describe(anyConditions, ' or ') : '';
  return [all, any].filter(Boolean).join(' and ');
}

function stepEdges(steps: FormStep[], index: number, fields: Map<string, FormField>): FlowEdge[] {
  const step = steps[index];
  const edges: FlowEdge[] = [];
  for (const route of step.routes ?? []) {
    if (route.to !== null && steps.findIndex((other) => other.id === route.to) <= index) continue;
    const label = describeConditions(route, fields);
    edges.push({ from: step.id, to: route.to, label: label || (edges.length > 0 ? 'Otherwise' : '') });
    if (!label) return edges;
  }
  const next = steps[index + 1];
  return [...edges, { from: step.id, to: next?.id ?? null, label: edges.length > 0 ? 'Otherwise' : '' }];
}

function merged(edges: FlowEdge[]): FlowEdge[] {
  const result: FlowEdge[] = [];
  for (const edge of edges) {
    const same = result.find((item) => item.from === edge.from && item.to === edge.to);
    if (same) same.label = [same.label, edge.label].filter(Boolean).join(' or ');
    else result.push({ ...edge });
  }
  return result;
}

export function buildGraph(definition: FormDefinition): FlowGraph {
  const steps = definition.steps ?? [];
  const fields = fieldsByKey(steps);
  const edges = merged(steps.flatMap((_, index) => stepEdges(steps, index, fields)));
  const depth = new Map<string, number>(steps.length ? [[steps[0].id, 0]] : []);
  for (const step of steps) {
    const own = depth.get(step.id) ?? 0;
    depth.set(step.id, own);
    for (const edge of edges.filter((item) => item.from === step.id && item.to)) {
      depth.set(edge.to!, Math.max(depth.get(edge.to!) ?? 0, own + 1));
    }
  }
  return { branching: steps.some((step) => step.routes?.length), depth, edges };
}
