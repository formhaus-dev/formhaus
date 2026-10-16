import type { FormDefinition, FormField } from '../types';
import type { EngineState } from './runtime-internals';
import { isPlainEntry } from '../validation/type-checks';
import { hasOwn, isGroup, keepId, topNodes, valueFields } from '../visibility/nodes';

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
  const values: Record<string, unknown> = {};
  const fill = (field: FormField) => {
    delete values[field.key];
    if (field.defaultValue !== undefined) values[field.key] = field.defaultValue;
    else if (isGroup(field) && field.defaultItems! > 0)
      values[field.key] = Array.from({ length: field.defaultItems! }, () => createValues(field.fields));
  };
  const source = initialValues ?? {};
  for (const field of fields) fill(field);
  for (const key of Object.keys(source)) {
    if (key !== '__proto__') values[key] = source[key];
  }
  for (const { key } of fields) {
    const same = fields.filter((field) => field.key === key);
    const field = (same.length > 1 && pick(key, { ...values })) || same[0];
    const items = values[key];
    if (!hasOwn(source, key)) fill(field);
    else if (isGroup(field) && items === source[key] && Array.isArray(items))
      values[key] = items.map((item) => (isPlainEntry(item) ? keepId(item, createValues(field.fields, item)) : item));
  }
  return values;
}

export function getChangedKeys(previous: Record<string, unknown>, next: Record<string, unknown>): Set<string> {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return new Set([...keys].filter((key) => !Object.is(previous[key], next[key])));
}
