import index from '../../../../templates/index.json';
import aliases from '../../template-aliases.json';
import { categories, counts, type TemplateEntry } from '../templates/catalog';
import type { Source } from './definition';
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

const templatePrefix = 'template:';

export const templateId = (slug: string) => `${templatePrefix}${slug}`;

export function sharedPreset({ id, text }: { id: string; text?: string }) {
  const slug = id.startsWith(templatePrefix) ? id.slice(templatePrefix.length) : undefined;
  return { preset: slug ? undefined : id, template: slug, text };
}

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

const fetched = new Map<string, Promise<object>>();

function templateDefinition(slug: string) {
  const cached = fetched.get(slug);
  if (cached) return cached;
  const request = fetch(`/templates/${slug}.json`)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`${response.status} ${slug}`))))
    .then((entry: { definition: object }) => entry.definition);
  fetched.set(slug, request);
  request.catch(() => fetched.delete(slug));
  return request;
}

export const formDefinition = (form: PlayForm) =>
  form.preset ? presets.find((entry) => entry.id === form.preset)!.load() : templateDefinition(form.slug!);

export const playSources: Source[] = [
  ...presets,
  ...templateGroups.flatMap((group) =>
    group.entries.map((entry) => ({ id: templateId(entry.slug), load: () => templateDefinition(entry.slug) })),
  ),
];
