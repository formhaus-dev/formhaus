import type { FormAction, FormDefinition, FormField, FormGroup, FormNode, ShowCondition } from '../types';
import { isGroup, isSection } from '../visibility/nodes';

export interface FieldEntry {
  field: FormField;
  path: string;
  step: number;
  group?: FormGroup;
}

export interface NodeEntry {
  node: FormNode;
  path: string;
  step: number;
  group?: FormGroup;
  parent?: FormNode;
}

export interface ConditionEntry {
  condition: ShowCondition;
  path: string;
  owner: 'field' | 'step' | 'route' | 'action';
  step: number;
  key?: string;
  group?: string;
}

export interface CheckContext {
  definition: FormDefinition;
  nodes: NodeEntry[];
  entries: FieldEntry[];
  keys: Map<string, FieldEntry>;
  keyList: string[];
  scopes: Map<string, Map<string, FieldEntry>>;
  conditions: ConditionEntry[];
  validators?: Record<string, unknown>;
  suggest: (value: string, candidates: string[]) => string | undefined;
  target: (key: string, group?: string) => FieldEntry | undefined;
}

type Owner = { show?: ShowCondition[]; showAny?: ShowCondition[] };

function collect(
  target: ConditionEntry[],
  source: Owner,
  path: string,
  owner: ConditionEntry['owner'],
  step: number,
  key?: string,
  group?: string,
): void {
  for (const name of ['show', 'showAny'] as const) {
    (source[name] ?? []).forEach((condition, index) => {
      target.push({ condition, path: `${path}/${name}/${index}`, owner, step, key, group });
    });
  }
}

function collectAction(target: ConditionEntry[], action: FormAction | false | undefined, path: string, step: number): void {
  (action ? (action.disabled ?? []) : []).forEach((condition, index) => {
    target.push({ condition, path: `${path}/disabled/${index}`, owner: 'action', step });
  });
}

export function createContext(
  definition: FormDefinition,
  validators?: Record<string, unknown>,
  suggest: CheckContext['suggest'] = () => undefined,
): CheckContext {
  const steps = definition.steps ?? [];
  const nodes: NodeEntry[] = [];
  const visit = (items: FormNode[], path: string, step: number, parent?: FormNode, group?: FormGroup) =>
    items.forEach((node, position) => {
      const at = `${path}/${position}`;
      nodes.push({ node, path: at, step, group, parent });
      if (isSection(node) || isGroup(node)) visit(node.fields, `${at}/fields`, step, node, isGroup(node) ? node : group);
    });
  if (steps.length) steps.forEach((step, index) => visit(step.fields, `/steps/${index}/fields`, index));
  else visit(definition.fields ?? [], '/fields', -1);
  const entries: FieldEntry[] = nodes.flatMap(({ node, path, step, group }) =>
    isSection(node) ? [] : [{ field: node, path, step, group }],
  );
  const keys = new Map<string, FieldEntry>();
  const scopes = new Map<string, Map<string, FieldEntry>>();
  for (const entry of entries) {
    const scope = entry.group ? (scopes.get(entry.group.key) ?? new Map<string, FieldEntry>()) : keys;
    if (entry.group) scopes.set(entry.group.key, scope);
    if (!scope.has(entry.field.key)) scope.set(entry.field.key, entry);
  }
  const conditions: ConditionEntry[] = [];
  for (const { node, path, step, group } of nodes) collect(conditions, node, path, 'field', step, node.key, group?.key);
  steps.forEach((step, index) => {
    collect(conditions, step, `/steps/${index}`, 'step', index);
    (step.routes ?? []).forEach((route, position) => {
      collect(conditions, route, `/steps/${index}/routes/${position}`, 'route', index);
    });
    for (const name of ['next', 'back', 'skip'] as const) collectAction(conditions, step[name], `/steps/${index}/${name}`, index);
  });
  collectAction(conditions, definition.submit, '/submit', -1);
  collectAction(conditions, definition.cancel, '/cancel', -1);
  return {
    definition,
    nodes,
    entries,
    keys,
    keyList: [...keys.keys()],
    scopes,
    conditions,
    validators,
    suggest,
    target: (key, group) => (group !== undefined && scopes.get(group)?.get(key)) || keys.get(key),
  };
}
