import index from '../../../../templates/index.json';
import aliases from '../../template-aliases.json';
import { categories, counts, type TemplateEntry } from '../templates/catalog';
import { presets } from './play-state';
import { data as presetCounts } from './presets.data';

export interface PlayForm {
  key: string;
  title: string;
  meta: string;
  group: string;
  preset?: string;
  slug?: string;
}

const templates = [...(index as TemplateEntry[])].sort((a, b) => a.title.localeCompare(b.title));
const bySlug = new Map(templates.map((template) => [template.slug, template]));

export const templateGroups = categories.map((category) => ({
  ...category,
  entries: templates.filter((template) => template.category === category.id),
}));

const templateForm = (template: TemplateEntry, group: string, prefix = 't'): PlayForm => ({
  key: `${prefix}:${template.slug}`,
  title: template.title,
  meta: counts(template),
  group,
  slug: template.slug,
});

const presetForm = (id: string, title: string): PlayForm => {
  const preset = presets.find((entry) => entry.id === id)!;
  return { key: `p:${id}`, title, meta: counts(presetCounts[preset.file]!), group: 'start', preset: id };
};

const starter = (slug: string) => templateForm(bySlug.get(slug)!, 'start', 's');

export const playGroups = [{ id: 'start', label: 'Start here' }, ...categories];

export const playForms: PlayForm[] = [
  presetForm('multi-step', 'Multi-step'),
  starter('contact-form'),
  presetForm('survey', 'Survey'),
  presetForm('event', 'Event registration'),
  presetForm('conditional', 'Conditional fields'),
  presetForm('validation', 'Validation'),
  starter('newsletter-signup'),
  starter('job-application'),
  ...templateGroups.flatMap((group) => group.entries.map((template) => templateForm(template, group.id))),
];

export const templateCount = templates.length;

export const templateSlug = (slug: string) => aliases[slug as keyof typeof aliases] ?? slug;

export async function templateDefinition(slug: string) {
  const entry = (await (await fetch(`/templates/${slug}.json`)).json()) as { definition: object };
  return entry.definition;
}

export const formDefinition = (form: PlayForm) =>
  form.preset ? presets.find((entry) => entry.id === form.preset)!.load() : templateDefinition(form.slug!);
