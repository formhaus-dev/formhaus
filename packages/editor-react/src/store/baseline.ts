import { toDefinition, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import type { Published } from '../host';
import { loader } from './initial';

const blank = (value: unknown) =>
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, item]) => !blank(item))
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export const definitionKey = (definition: FormDefinition) => canonical(definition);
const formKeys = new WeakMap<BuilderForm, string>();

export function formKey(form: BuilderForm): string {
  const known = formKeys.get(form);
  if (known !== undefined) return known;
  const key = canonical(toDefinition(form));
  formKeys.set(form, key);
  return key;
}

export const baselineOf = (published: Published | null) => (published ? formKey(loader(published)(published.definition)) : null);
