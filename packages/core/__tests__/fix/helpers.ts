import { applyFix, suggestFixes } from '../../src/fix';

export type Definition = Record<string, unknown>;

export const form = (fields: unknown[], extra: Definition = {}): Definition => ({
  id: 'f',
  title: 'F',
  submit: { label: 'Submit' },
  fields,
  ...extra,
});
export const text = (key: string, extra: Definition = {}) => ({ key, type: 'text', label: key, ...extra });

export function fixesAt(definition: unknown, path: string, code?: string) {
  const issue = suggestFixes(definition).find((item) => item.path === path && (!code || item.code === code));
  return (issue?.fixes ?? []).map(({ title, safe, patch }) => ({ title, safe, patch }));
}

export function repaired(definition: Definition, path: string, code?: string): Definition {
  const fix = fixesAt(definition, path, code)[0];
  if (!fix) throw new Error(`no fix at ${path}`);
  return applyFix(definition, fix.patch);
}
