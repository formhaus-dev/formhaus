import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FormDefinition } from '@formhaus/core';

const root = resolve(__dirname, '../../..');
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

export const templates: [string, FormDefinition][] = readdirSync(resolve(root, 'templates'))
  .filter((name) => name.endsWith('.json') && !['index.json', 'order.json'].includes(name))
  .map((name) => [name, read(resolve(root, 'templates', name)).definition]);

export const recipes: [string, FormDefinition][] = readdirSync(resolve(root, 'docs/recipes/definitions'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => [name, read(resolve(root, 'docs/recipes/definitions', name))]);

export function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize((value as Record<string, unknown>)[key])]));
}

export const template = (name: string) => templates.find(([file]) => file === name)![1];
