import type { FormDefinition } from '../types';

export interface DraftStore {
  load(id: string, version: number | undefined): Record<string, unknown> | null;
  save(id: string, version: number | undefined, values: Record<string, unknown>): void;
  clear(id: string): void;
}

const SENSITIVE = new Set(['password', 'file']);
const WEEK = 7 * 24 * 60 * 60 * 1000;

export function draftValues(definition: FormDefinition, values: Record<string, unknown>): Record<string, unknown> {
  const fields = [...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)];
  const kept: Record<string, unknown> = {};
  for (const field of fields) {
    if (!SENSITIVE.has(field.type) && values[field.key] !== undefined) kept[field.key] = values[field.key];
  }
  return kept;
}

export function sessionDraftStore(maxAge = WEEK, storage = (globalThis as { sessionStorage?: DraftStorage }).sessionStorage): DraftStore {
  const key = (id: string) => `formhaus:draft:${id}`;
  const attempt = <T>(action: () => T, fallback: T): T => {
    try { return storage ? action() : fallback; } catch { return fallback; }
  };
  return {
    load: (id, version) => attempt(() => {
      const draft = JSON.parse(storage!.getItem(key(id)) ?? 'null') as { version?: number; savedAt: number; values: Record<string, unknown> } | null;
      return draft && draft.version === version && Date.now() - draft.savedAt < maxAge ? draft.values : null;
    }, null),
    save: (id, version, values) => attempt(() => storage!.setItem(key(id), JSON.stringify({ version, savedAt: Date.now(), values })), undefined),
    clear: (id) => attempt(() => storage!.removeItem(key(id)), undefined),
  };
}
