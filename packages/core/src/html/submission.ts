import { optionValue } from '../fields/options';
import { numberValue } from '../fields/values';
import type { FieldOption, FormDefinition, FormField } from '../types';
import { pageFields } from './support';

export type FormDataFields = Record<string, string | readonly string[]>;

export interface FieldEntries {
  entries(): Iterable<readonly [string, unknown]>;
}

export interface ParseOptions {
  options?: Record<string, FieldOption[]>;
}

const MAX_REPEATS = 1000;

const isPlain = (data: unknown): data is Record<string, unknown> => Object.prototype.toString.call(data) === '[object Object]';

function collect(data: unknown): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  const add = (name: string, value: unknown) => {
    if (typeof value !== 'string') return;
    const list = fields.get(name);
    if (!list) fields.set(name, [value]);
    else if (list.length < MAX_REPEATS) list.push(value);
  };
  if (!Array.isArray(data) && typeof (data as FieldEntries | null)?.entries === 'function') {
    for (const [name, value] of (data as FieldEntries).entries()) add(String(name), value);
  } else if (isPlain(data)) {
    for (const name of Object.keys(data)) {
      const raw = data[name];
      for (const value of Array.isArray(raw) ? raw.slice(0, MAX_REPEATS) : [raw]) add(name, value);
    }
  } else throw new TypeError('parseFormData takes FormData, URLSearchParams or an object of strings.');
  return fields;
}

function typed(field: FormField, raw: string[] | undefined, options: FieldOption[] | undefined): unknown {
  switch (field.type) {
    case 'checkbox':
    case 'switch':
      return !!raw?.some((item) => item !== '');
    case 'multiselect':
      return (raw ?? []).slice(0, (options ?? field.options)?.length ?? MAX_REPEATS);
    case 'autocomplete':
      return raw && optionValue(options ?? field.options ?? [], raw[0]);
    case 'number':
    case 'scale':
    case 'rating':
      return raw && numberValue(raw[0]);
    default:
      return raw?.[0];
  }
}

export function parseFormData(
  definition: FormDefinition,
  data: FormDataFields | FieldEntries,
  parse: ParseOptions = {},
): Record<string, unknown> {
  const fields = collect(data);
  const values: Record<string, unknown> = {};
  for (const field of pageFields(definition)) {
    const value = typed(field, fields.get(field.key), parse.options?.[field.key]);
    if (value !== undefined) values[field.key] = value;
  }
  return values;
}
