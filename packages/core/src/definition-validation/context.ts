import type { FormAction, FormDefinition, FormField, ShowCondition } from '../types';

export interface FieldEntry {
  field: FormField;
  path: string;
  step: number;
}

export interface ConditionEntry {
  condition: ShowCondition;
  path: string;
  owner: 'field' | 'step' | 'route' | 'action';
  step: number;
  key?: string;
}

export interface CheckContext {
  definition: FormDefinition;
  entries: FieldEntry[];
  keys: Map<string, FieldEntry>;
  keyList: string[];
  conditions: ConditionEntry[];
  validators?: Record<string, unknown>;
  suggest: (value: string, candidates: string[]) => string | undefined;
}

type Owner = { show?: ShowCondition[]; showAny?: ShowCondition[] };

function collect(target: ConditionEntry[], source: Owner, path: string, owner: ConditionEntry['owner'], step: number, key?: string): void {
  for (const name of ['show', 'showAny'] as const) {
    (source[name] ?? []).forEach((condition, index) => {
      target.push({ condition, path: `${path}/${name}/${index}`, owner, step, key });
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
  const entries: FieldEntry[] = steps.length
    ? steps.flatMap((step, index) =>
        step.fields.map((field, position) => ({ field, path: `/steps/${index}/fields/${position}`, step: index })),
      )
    : (definition.fields ?? []).map((field, position) => ({ field, path: `/fields/${position}`, step: -1 }));
  const keys = new Map<string, FieldEntry>();
  for (const entry of entries) if (!keys.has(entry.field.key)) keys.set(entry.field.key, entry);
  const conditions: ConditionEntry[] = [];
  for (const entry of entries) collect(conditions, entry.field, entry.path, 'field', entry.step, entry.field.key);
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
    entries,
    keys,
    keyList: [...keys.keys()],
    conditions,
    validators,
    suggest,
  };
}
