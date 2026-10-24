import apps from './apps.json';

export interface Design {
  id: string;
  label: string;
  framework: string;
  dir: string;
  group: 'React' | 'Vue' | 'Government';
  inline?: boolean;
  lightOnly?: boolean;
}

export const designs = apps as Design[];

export const designGroups = (['React', 'Vue', 'Government'] as const).map((group) => ({
  group,
  entries: designs.filter((entry) => entry.group === group),
}));

export const widths = [
  { id: 'phone', label: 'Phone', icon: 'smartphone', px: 390 },
  { id: 'tablet', label: 'Tablet', icon: 'tablet', px: 768 },
  { id: 'desktop', label: 'Desktop', icon: 'monitor', px: 0 },
] as const;

export type WidthId = (typeof widths)[number]['id'];

const loaders = import.meta.glob<object>(
  '../../../../examples/definitions/{multi-step,conditional-fields,validation,survey,branching-form,event-registration}.json',
  {
    import: 'default',
  },
);
const load = (name: string) => loaders[`../../../../examples/definitions/${name}.json`]!;

const preset = (id: string, label: string, file: string) => ({ id, label, file, load: load(file) });

export const presets = [
  preset('multi-step', 'Multi-step', 'multi-step'),
  preset('conditional', 'Conditional fields', 'conditional-fields'),
  preset('validation', 'Validation', 'validation'),
  preset('survey', 'Survey with matrix', 'survey'),
  preset('branching', 'Branching', 'branching-form'),
  preset('event', 'Event registration', 'event-registration'),
];

let entryVisit = false;
export const markEntryVisit = () => {
  entryVisit = true;
};
export function takeEntryVisit() {
  const visited = entryVisit;
  entryVisit = false;
  return visited;
}

export const appUrl = (design: Design) => `/play/apps/${design.id}/index.html`;
export const codeUrl = (design: Design) => `/play/apps/${design.id}/code.json`;

interface CodeFile {
  path: string;
  lang: string;
  source: string;
  html: string;
}

export interface Code {
  dir: string;
  files: CodeFile[];
  project: Record<string, string>;
}

export function stackblitz(code: Code, definition: string, title: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `https://stackblitz.com/run?file=${encodeURIComponent(code.files[0]!.path)}`;
  form.target = '_blank';
  const files = { ...code.project, 'src/definition.json': `${definition.trim()}\n` };
  const fields: Record<string, string> = {
    'project[title]': title,
    'project[description]': `Formhaus example: ${code.dir}`,
    'project[template]': 'node',
  };
  for (const [path, content] of Object.entries(files)) fields[`project[files][${path}]`] = content;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}
