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
