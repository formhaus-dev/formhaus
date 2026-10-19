import type { FormDefinition, FormField } from '../types';
import { splitPath, valueFields } from '../visibility/nodes';
import { ANSWER_AGAIN } from './failures';
import { SCALE_TYPES, scaleRange } from '../validation/type-checks';

const SHAPES: Record<string, string> = {
  multiselect: 'list',
  checkbox: 'flag',
  switch: 'flag',
  number: 'number',
  scale: 'number',
  rating: 'number',
  file: 'file',
  group: 'list',
};

function fieldsOf(definition: FormDefinition): FormField[] {
  return valueFields([...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)]);
}

function shapeOf(field: FormField): string {
  return SHAPES[field.type] ?? 'text';
}

function allowed(field: FormField, value: unknown): boolean {
  if (SCALE_TYPES.includes(field.type)) {
    const [min, max] = scaleRange(field);
    return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
  }
  if (!Array.isArray(field.options)) return true;
  const options = new Set(field.options.map((option) => String(option.value)));
  return (Array.isArray(value) ? value : [value]).every((item) => options.has(String(item)));
}

function fits(previous: FormField | undefined, next: FormField, value: unknown): boolean {
  if (previous && shapeOf(previous) !== shapeOf(next)) return false;
  switch (shapeOf(next)) {
    case 'list':
      return Array.isArray(value);
    case 'flag':
      return typeof value === 'boolean';
    case 'number':
      return typeof value === 'number';
    case 'text':
      return typeof value === 'string';
    default:
      return previous !== undefined;
  }
}

export function carryValues(values: Record<string, unknown>, next: FormDefinition, previous?: FormDefinition): Record<string, unknown> {
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
  const known = fieldsOf(definition);
  const fields: Record<string, string> = {};
  const other = new Set<string>();
  for (const [key, message] of Object.entries(errors)) {
    if (known.some((field) => field.key === key || (field.type === 'group' && splitPath(field.key, key)))) fields[key] = message;
    else other.add(message);
  }
  return { fields, other: [...other] };
}

export function updatedErrors(
  next: FormDefinition,
  sent: Record<string, unknown>,
  kept: Record<string, unknown>,
  rejected: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fieldsOf(next)) {
    const answered = sent[field.key] !== undefined && sent[field.key] !== null && sent[field.key] !== '';
    if (answered && !(field.key in kept)) errors[field.key] = ANSWER_AGAIN;
    else if (rejected[field.key] && (!answered || field.key in kept)) errors[field.key] = rejected[field.key];
  }
  return errors;
}
