import type { FormDefinition, FormField } from '../types';
import type { EngineInternals, EngineState } from './runtime-internals';
import type { NotifyOptions } from './subscriptions';
import { isPlainEntry, maxItems } from '../validation/type-checks';
import { hasOwn, isEntry, isGroup, keepId, topNodes, valueFields } from '../visibility/nodes';

export const shownError = (errors: Record<string, string>, field: FormField) => field.type !== 'hidden' && errors[field.key] !== undefined;

export function getAllFields(definition: FormDefinition): FormField[] {
  return valueFields(topNodes(definition));
}

export const initialState = (values: Record<string, unknown>): EngineState => ({
  values,
  errors: {},
  topLevelErrors: [],
  serverErrors: {},
  serverFormErrors: [],
  currentStepIndex: 0,
  fieldLoading: {},
  stepValidating: false,
  submitting: false,
});

export function createValues(
  fields: FormField[],
  initialValues?: Record<string, unknown>,
  pick: (key: string, values: Record<string, unknown>) => FormField | undefined = () => undefined,
): Record<string, unknown> {
  const byKey = new Map<string, FormField[]>();
  for (const field of fields) {
    const same = byKey.get(field.key);
    if (same) same.push(field);
    else byKey.set(field.key, [field]);
  }
  const values: Record<string, unknown> = {};
  const fill = (field: FormField) => {
    delete values[field.key];
    if (field.defaultValue !== undefined) values[field.key] = field.defaultValue;
    else if (isGroup(field) && field.defaultItems! > 0)
      values[field.key] = Array.from({ length: Math.min(field.defaultItems!, maxItems(field)) }, () => createValues(field.fields));
  };
  const source = initialValues ?? {};
  for (const field of fields) {
    const same = byKey.get(field.key)!;
    if (same[same.length - 1] === field) fill(field);
  }
  for (const key of Object.keys(source)) {
    if (key !== '__proto__') values[key] = source[key];
  }
  for (const { key } of fields) {
    const same = byKey.get(key)!;
    const shared = same.length > 1;
    const field = (shared && pick(key, { ...values })) || same[0];
    const items = values[key];
    if (!hasOwn(source, key)) {
      delete values[key];
      if (shared) fill(field);
      else if (items !== undefined) values[key] = items;
    } else if (isGroup(field) && items === source[key] && Array.isArray(items))
      values[key] = items.map((item) => (isPlainEntry(item) ? keepId(item, createValues(field.fields, item)) : item));
  }
  return values;
}

export function getChangedKeys(previous: Record<string, unknown>, next: Record<string, unknown>): Set<string> {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return new Set([...keys].filter((key) => !Object.is(previous[key], next[key])));
}

const sameItems = (previous: unknown, next: unknown) =>
  Array.isArray(previous) &&
  Array.isArray(next) &&
  previous.length === next.length &&
  previous.every(
    (item, index) => Object.is(item, next[index]) || (isEntry(item) && isEntry(next[index]) && !getChangedKeys(item, next[index]).size),
  );

export const valuesDiffer = (previous: Record<string, unknown>, next: Record<string, unknown>): boolean =>
  [...getChangedKeys(previous, next)].some((key) => !sameItems(previous[key], next[key]));

export const keptValues = (engine: EngineInternals): Record<string, unknown> =>
  engine.visibility.withKept(engine.state.values, [...engine.skipped.values()].flat());

export function keptChanged(engine: EngineInternals & { snapshot?: Record<string, unknown> }, options: NotifyOptions): boolean | undefined {
  if (engine.visibility.keep && engine.snapshot) options.valuesChanged = valuesDiffer(engine.snapshot, keptValues(engine));
  return options.valuesChanged;
}
