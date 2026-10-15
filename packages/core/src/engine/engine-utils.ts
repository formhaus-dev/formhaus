import type { FormDefinition, FormField } from '../types';
import type { EngineState } from './runtime-internals';
import { isGroup, topNodes, valueFields } from '../visibility/nodes';

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

export function createValues(fields: FormField[], initialValues?: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) values[field.key] = field.defaultValue;
    else if (isGroup(field) && field.defaultItems! > 0)
      values[field.key] = Array.from({ length: field.defaultItems! }, () => createValues(field.fields));
  }
  const source = initialValues ?? {};
  for (const key of Object.keys(source)) {
    if (key !== '__proto__') values[key] = source[key];
  }
  return values;
}

export function getChangedKeys(previous: Record<string, unknown>, next: Record<string, unknown>): Set<string> {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return new Set([...keys].filter((key) => !Object.is(previous[key], next[key])));
}
