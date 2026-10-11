import type { FormDefinition, FormField } from '../types';

const SHAPES: Record<string, string> = {
  multiselect: 'list',
  checkbox: 'flag',
  switch: 'flag',
  number: 'number',
  file: 'file',
};

function fieldsOf(definition: FormDefinition): FormField[] {
  return [...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)];
}

function shapeOf(field: FormField): string {
  return SHAPES[field.type] ?? 'text';
}

function allowed(field: FormField, value: unknown): boolean {
  if (!Array.isArray(field.options)) return true;
  const options = new Set(field.options.map((option) => String(option.value)));
  return (Array.isArray(value) ? value : [value]).every((item) => options.has(String(item)));
}

function fits(previous: FormField | undefined, next: FormField, value: unknown): boolean {
  if (previous && shapeOf(previous) !== shapeOf(next)) return false;
  switch (shapeOf(next)) {
    case 'list': return Array.isArray(value);
    case 'flag': return typeof value === 'boolean';
    case 'number': return typeof value === 'number';
    case 'text': return typeof value === 'string';
    default: return previous !== undefined;
  }
}

export function carryValues(
  values: Record<string, unknown>,
  next: FormDefinition,
  previous?: FormDefinition,
): Record<string, unknown> {
  const before = new Map(previous ? fieldsOf(previous).map((field) => [field.key, field]) : []);
  const kept: Record<string, unknown> = {};
  for (const field of fieldsOf(next)) {
    const value = values[field.key];
    if (value === undefined || value === null) continue;
    if (fits(before.get(field.key), field, value) && allowed(field, value)) kept[field.key] = value;
  }
  return kept;
}

export function splitErrors(definition: FormDefinition, errors: Record<string, string>) {
  const known = new Set(fieldsOf(definition).map((field) => field.key));
  const fields: Record<string, string> = {};
  const other: string[] = [];
  for (const [key, message] of Object.entries(errors)) {
    if (known.has(key)) fields[key] = message;
    else other.push(`${key}: ${message}`);
  }
  return { fields, other };
}
