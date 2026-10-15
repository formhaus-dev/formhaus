import type { FormDefinition } from '../types';
import { valueFields } from '../visibility/nodes';

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface DraftStore {
  load(id: string, version: number | undefined): Record<string, unknown> | null;
  save(id: string, version: number | undefined, values: Record<string, unknown>): void;
  clear(id: string): void;
}

const SENSITIVE = new Set(['password', 'file']);
const WEEK = 7 * 24 * 60 * 60 * 1000;

export function draftValues(definition: FormDefinition, values: Record<string, unknown>): Record<string, unknown> {
  const fields = valueFields([...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)]);
  const kept: Record<string, unknown> = {};
  for (const field of fields) {
    if (!SENSITIVE.has(field.type) && values[field.key] !== undefined) kept[field.key] = values[field.key];
  }
  return kept;
}

const sessionStorageOf = () => (globalThis as { sessionStorage?: DraftStorage }).sessionStorage;

export function sessionDraftStore(maxAge = WEEK, storageOf: () => DraftStorage | undefined = sessionStorageOf): DraftStore {
  const key = (id: string) => `formhaus:draft:${id}`;
  const attempt = <T>(action: (storage: DraftStorage) => T, fallback: T): T => {
    try {
      const storage = storageOf();
      return storage ? action(storage) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    load: (id, version) =>
      attempt((storage) => {
        const draft = JSON.parse(storage.getItem(key(id)) ?? 'null') as {
          version?: number;
          savedAt: number;
          values: Record<string, unknown>;
        } | null;
        return draft && draft.version === version && Date.now() - draft.savedAt < maxAge ? draft.values : null;
      }, null),
    save: (id, version, values) =>
      attempt((storage) => storage.setItem(key(id), JSON.stringify({ version, savedAt: Date.now(), values })), undefined),
    clear: (id) => attempt((storage) => storage.removeItem(key(id)), undefined),
  };
}
