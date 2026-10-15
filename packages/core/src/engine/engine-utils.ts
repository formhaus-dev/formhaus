import type { FormDefinition, FormField } from '../types';

export function conditionFields(source: Pick<FormField, 'show' | 'showAny'>): string[] {
  return [...(source.show ?? []), ...(source.showAny ?? [])].map((condition) => condition.field);
}

export const shownError = (errors: Record<string, string>, field: FormField) => field.type !== 'hidden' && errors[field.key] !== undefined;

export function getAllFields(definition: FormDefinition): FormField[] {
  return definition.steps?.length ? definition.steps.flatMap((step) => step.fields) : (definition.fields ?? []);
}

export function createValues(fields: FormField[], initialValues?: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) values[field.key] = field.defaultValue;
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
