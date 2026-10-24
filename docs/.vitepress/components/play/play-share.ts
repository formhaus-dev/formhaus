import type { DefinitionIssue } from '@formhaus/core';
import type { Mark } from './json-editor';

export interface Shared {
  design?: string;
  width?: string;
  preset?: string;
  template?: string;
  text?: string;
}

const toBase64Url = (bytes: Uint8Array) => {
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(transform)).arrayBuffer());
}

export async function writeHash(state: Shared): Promise<string> {
  const params = new URLSearchParams();
  if (state.design) params.set('ds', state.design);
  if (state.width && state.width !== 'desktop') params.set('w', state.width);
  if (state.template) params.set('t', state.template);
  else if (state.preset) params.set('p', state.preset);
  if (state.text) params.set('d', toBase64Url(await pipe(new TextEncoder().encode(state.text), new CompressionStream('deflate-raw'))));
  return `#${params}`;
}

export async function readHash(hash: string): Promise<Shared> {
  const params = new URLSearchParams(hash.slice(1));
  const shared: Shared = {
    design: params.get('ds') ?? undefined,
    width: params.get('w') ?? undefined,
    preset: params.get('p') ?? undefined,
    template: params.get('t') ?? undefined,
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

export function errorOffset(text: string): number {
  let at = 0;
  const fail = (): never => {
    throw new RangeError(String(at));
  };
  const space = () => {
    while (/[ \t\n\r]/.test(text[at] ?? '')) at++;
  };
  const expect = (char: string) => {
    if (text[at] !== char) fail();
    at++;
  };
  const string = () => {
    at++;
    while (text[at] !== '"') {
      if (at >= text.length || text[at]! < ' ') fail();
      at += text[at] === '\\' ? 2 : 1;
    }
    at++;
  };
  const list = (close: string, item: () => void) => {
    at++;
    space();
    if (text[at] === close) {
      at++;
      return;
    }
    for (;;) {
      item();
      space();
      if (text[at] === close) {
        at++;
        return;
      }
      expect(',');
      space();
    }
  };
  const value = () => {
    space();
    const char = text[at];
    if (char === '{')
      list('}', () => {
        if (text[at] !== '"') fail();
        string();
        space();
        expect(':');
        value();
      });
    else if (char === '[') list(']', value);
    else if (char === '"') string();
    else {
      const token = /^(true|false|null|-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?)/.exec(text.slice(at));
      if (!token) fail();
      at += token![0].length;
    }
  };
  try {
    value();
    space();
    if (at < text.length) fail();
  } catch (error) {
    if (error instanceof RangeError) return Math.min(Number(error.message), text.length);
    throw error;
  }
  return text.length;
}

export function syntaxError(text: string, error: unknown): JsonError {
  const raw = error instanceof Error ? error.message : String(error);
  const from = errorOffset(text);
  const message = raw
    .replace(/^JSON(\.parse:| Parse error:) /, '')
    .replace(/,? (in JSON )?at position \d+.*$/, '')
    .replace(/ (in object |in array )?at line \d+ column \d+ of the JSON data$/, '');
  return { message: message.charAt(0).toUpperCase() + message.slice(1), from, line: text.slice(0, from).split('\n').length };
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

export const issueText = (message: string) => message.replace(/^\/[^:\s]*:\s*/, '').replace(/^\/:\s*/, '');

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
