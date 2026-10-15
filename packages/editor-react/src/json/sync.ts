import { toDefinition, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';

export interface JsonError {
  message: string;
  from: number;
  line: number;
}

export type ParsedJson = { form: BuilderForm; definition: FormDefinition } | { error: JsonError };

export const formatDefinition = (form: BuilderForm) => JSON.stringify(toDefinition(form), null, 2);

export const plainDefinition = (form: BuilderForm): FormDefinition => JSON.parse(JSON.stringify(toDefinition(form)));

export const sameDefinition = (a: BuilderForm, b: BuilderForm) => JSON.stringify(toDefinition(a)) === JSON.stringify(toDefinition(b));

function offset(text: string, message: string): number {
  const position = /position (\d+)/.exec(message);
  if (position) return Number(position[1]);
  const place = /line (\d+) column (\d+)/.exec(message);
  if (!place) return text.length;
  const lines = text.split('\n').slice(0, Number(place[1]) - 1);
  return lines.reduce((sum, line) => sum + line.length + 1, 0) + Number(place[2]) - 1;
}

function failure(text: string, message: string, from: number): { error: JsonError } {
  const at = Math.min(Math.max(from, 0), text.length);
  return { error: { message, from: at, line: text.slice(0, at).split('\n').length } };
}

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function parseJson(text: string, load: (definition: FormDefinition) => BuilderForm): ParsedJson {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const message = reason(error);
    return failure(text, message.replace(/\s*(in JSON )?at position \d+.*$/, '').replace(/^JSON\.parse: /, ''), offset(text, message));
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return failure(text, 'The definition must be a JSON object', 0);
  const definition = value as FormDefinition;
  try {
    return { form: load(definition), definition };
  } catch (error) {
    return failure(text, reason(error), 0);
  }
}

const MARK = '\u0000fh-mark\u0000';

const tokensOf = (pointer: string) =>
  pointer
    .slice(1)
    .split('/')
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));

export function locate(definition: FormDefinition, pointer: string, part: 'value' | 'key'): { from: number; to: number } | null {
  const copy: unknown = JSON.parse(JSON.stringify(definition));
  const tokens = tokensOf(pointer);
  const name = tokens.pop();
  let node = copy as Record<string, unknown>;
  for (const token of tokens) {
    if (typeof node[token] !== 'object' || node[token] === null) return null;
    node = node[token] as Record<string, unknown>;
  }
  if (name === undefined || !Object.prototype.hasOwnProperty.call(node, name)) return null;
  const original = node[name];
  if (part === 'value') node[name] = MARK;
  else {
    const entries = Object.entries(node);
    for (const [key] of entries) delete node[key];
    for (const [key, value] of entries) node[key === name ? MARK : key] = value;
  }
  const at = JSON.stringify(copy, null, 2).indexOf(JSON.stringify(MARK));
  if (at < 0) return null;
  const text = part === 'value' ? JSON.stringify(original) : JSON.stringify(name);
  const quoted = text.startsWith('"');
  return { from: at + (quoted ? 1 : 0), to: at + text.length - (quoted ? 1 : 0) };
}
