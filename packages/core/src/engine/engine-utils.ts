import type { FormDefinition, FormField } from '../types';

export function hasFieldsAndSteps(definition: FormDefinition): boolean {
  return !!definition.fields?.length && !!definition.steps?.length;
}

export function getAllFields(definition: FormDefinition): FormField[] {
  return definition.steps?.length ? definition.steps.flatMap((step) => step.fields) : definition.fields ?? [];
}

export function createValues(
  fields: FormField[],
  initialValues?: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) values[field.key] = field.defaultValue;
  }
  return Object.assign(values, initialValues);
}

export function getChangedKeys(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): Set<string> {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return new Set([...keys].filter((key) => !Object.is(previous[key], next[key])));
}
