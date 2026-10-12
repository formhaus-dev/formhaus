import type { FormDefinition } from '@formhaus/core';
import index from '../../../../templates/index.json';
import type { TemplateEntry } from '../templates/catalog';

const loaders = import.meta.glob<string>(['../../../../templates/*.json', '!../../../../templates/index.json'], {
  query: '?raw',
  import: 'default',
});

export const starter: FormDefinition = {
  id: 'untitled-form',
  title: 'Untitled form',
  submit: { label: 'Submit' },
  fields: [{ key: 'email', type: 'email', label: 'Email' }],
};

const blank: FormDefinition = { id: 'untitled-form', title: 'Untitled form', submit: { label: 'Submit' }, fields: [] };

export interface Start {
  definition: FormDefinition;
  label: string;
}

export function hasStart(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has('new') || params.has('template');
}

export async function requestedStart(search: string): Promise<Start | null> {
  const params = new URLSearchParams(search);
  if (params.has('new')) return { definition: blank, label: 'a blank form' };
  const slug = params.get('template') ?? '';
  const entry = (index as TemplateEntry[]).find((template) => template.slug === slug);
  const load = entry && loaders[`../../../../templates/${entry.slug}.json`];
  if (!entry || !load) return null;
  return { definition: (JSON.parse(await load()) as { definition: FormDefinition }).definition, label: `the ${entry.title} template` };
}

const same = (a: FormDefinition, b: FormDefinition) => JSON.stringify(a) === JSON.stringify(b);
const filled = (definition: FormDefinition) => (definition.fields?.length ?? 0) > 0 || (definition.steps?.length ?? 0) > 0;

export function conflicts(draft: FormDefinition | undefined, next: FormDefinition): draft is FormDefinition {
  return !!draft && filled(draft) && !same(draft, next) && !same(draft, starter);
}
