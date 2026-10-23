import type { DefinitionIssue } from '@formhaus/core';
import type { Mark } from './json-editor';

export interface Design {
  id: string;
  label: string;
  framework: string;
  dir: string;
}

export const designs: Design[] = [
  { id: 'react', label: 'Default', framework: 'React', dir: 'react-default' },
  { id: 'shadcn', label: 'shadcn/ui', framework: 'React', dir: 'react-shadcn' },
  { id: 'vuetify', label: 'Vuetify', framework: 'Vue', dir: 'vue-vuetify' },
];

export const widths = [
  { id: 'phone', label: 'Phone', icon: 'smartphone', px: 390 },
  { id: 'tablet', label: 'Tablet', icon: 'tablet', px: 768 },
  { id: 'desktop', label: 'Desktop', icon: 'monitor', px: 0 },
] as const;

export type WidthId = (typeof widths)[number]['id'];

const loaders = import.meta.glob<object>(
  '../../../../examples/definitions/{multi-step,conditional-fields,validation,survey,branching-form}.json',
  {
    import: 'default',
  },
);
const load = (name: string) => loaders[`../../../../examples/definitions/${name}.json`]!;

export const presets = [
  { id: 'multi-step', label: 'Multi-step', load: load('multi-step') },
  { id: 'conditional', label: 'Conditional fields', load: load('conditional-fields') },
  { id: 'validation', label: 'Validation', load: load('validation') },
  { id: 'survey', label: 'Survey with matrix', load: load('survey') },
  { id: 'branching', label: 'Branching', load: load('branching-form') },
];

export const appUrl = (design: Design) => `/play/apps/${design.id}/index.html`;
export const codeUrl = (design: Design) => `/play/apps/${design.id}/code.json`;

export interface CodeFile {
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

export interface Shared {
  design?: string;
  width?: string;
  preset?: string;
  text?: string;
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const fromBase64Url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(transform)).arrayBuffer());
}

export async function writeHash(state: Shared): Promise<string> {
  const params = new URLSearchParams();
  if (state.design) params.set('ds', state.design);
  if (state.width && state.width !== 'desktop') params.set('w', state.width);
  if (state.text) params.set('d', toBase64Url(await pipe(new TextEncoder().encode(state.text), new CompressionStream('deflate-raw'))));
  else if (state.preset) params.set('p', state.preset);
  return `#${params}`;
}

export async function readHash(hash: string): Promise<Shared> {
  const params = new URLSearchParams(hash.slice(1));
  const shared: Shared = {
    design: params.get('ds') ?? undefined,
    width: params.get('w') ?? undefined,
    preset: params.get('p') ?? undefined,
  };
  const packed = params.get('d');
  if (packed) {
    try {
      shared.text = new TextDecoder().decode(await pipe(fromBase64Url(packed), new DecompressionStream('deflate-raw')));
    } catch {
      shared.text = undefined;
    }
  }
  return shared;
}

export interface JsonError {
  message: string;
  from: number;
  line: number;
}

export function syntaxError(text: string, error: unknown): JsonError {
  const raw = error instanceof Error ? error.message : String(error);
  const position = /position (\d+)/.exec(raw);
  const place = /line (\d+) column (\d+)/.exec(raw);
  let from = text.length;
  if (position) from = Number(position[1]);
  else if (place)
    from =
      text
        .split('\n')
        .slice(0, Number(place[1]) - 1)
        .reduce((sum, line) => sum + line.length + 1, 0) +
      Number(place[2]) -
      1;
  const message = raw
    .replace(/\s*(in JSON )?at position \d+.*$/, '')
    .replace(/^JSON\.parse: /, '')
    .replace(/\s*\(line \d+ column \d+\)$/, '');
  return { message, from, line: text.slice(0, from).split('\n').length };
}

type Spans = Map<string, { from: number; to: number }>;

function spans(text: string): Spans {
  const found: Spans = new Map();
  let at = 0;
  const space = () => {
    while (at < text.length && /\s/.test(text[at]!)) at++;
  };
  const string = () => {
    const start = at++;
    while (at < text.length && text[at] !== '"') at += text[at] === '\\' ? 2 : 1;
    at++;
    return JSON.parse(text.slice(start, at)) as string;
  };
  const value = (pointer: string, keyFrom: number) => {
    space();
    const from = at;
    if (text[at] === '{') {
      at++;
      space();
      while (at < text.length && text[at] !== '}') {
        space();
        const keyAt = at;
        const key = string();
        space();
        at++;
        value(`${pointer}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`, keyAt);
        space();
        if (text[at] === ',') at++;
        space();
      }
      at++;
    } else if (text[at] === '[') {
      at++;
      let index = 0;
      space();
      while (at < text.length && text[at] !== ']') {
        value(`${pointer}/${index++}`, -1);
        space();
        if (text[at] === ',') at++;
        space();
      }
      at++;
    } else if (text[at] === '"') string();
    else while (at < text.length && /[^\s,}\]]/.test(text[at]!)) at++;
    found.set(pointer, { from: keyFrom >= 0 ? keyFrom : from, to: text[from] === '{' || text[from] === '[' ? from + 1 : at });
  };
  value('', -1);
  return found;
}

export function issueMarks(text: string, issues: Pick<DefinitionIssue, 'path' | 'message' | 'severity'>[]): Mark[] {
  if (!issues.length) return [];
  const found = spans(text);
  return issues.map((issue) => {
    let pointer = issue.path;
    while (pointer && !found.has(pointer)) pointer = pointer.slice(0, pointer.lastIndexOf('/'));
    const span = found.get(pointer) ?? { from: 0, to: 1 };
    return { ...span, message: issueText(issue.message), severity: issue.severity };
  });
}

export const issueText = (message: string) => message.replace(/^\/[^:\s]*:\s*/, '').replace(/^\/:\s*/, '');

export function stackblitz(code: Code, definition: string, title: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://stackblitz.com/run?file=src%2FApp.' + (code.files[0]!.path.endsWith('.vue') ? 'vue' : 'tsx');
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
