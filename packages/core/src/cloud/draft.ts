import type { FormDefinition, FormField, FormGroup } from '../types';
import { isEntry, isGroup, valueFields } from '../visibility/nodes';

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

const SENSITIVE = new Set(['password', 'file', 'hidden']);
const WEEK = 7 * 24 * 60 * 60 * 1000;

function keep(fields: FormField[], values: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set(fields.filter((field) => SENSITIVE.has(field.type)).map((field) => field.key));
  const kept: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.key];
    if (blocked.has(field.key) || value === undefined) continue;
    const items = fields.filter((other) => other.key === field.key && isGroup(other)).flatMap((other) => (other as FormGroup).fields);
    kept[field.key] = items.length && Array.isArray(value) ? value.map((item) => (isEntry(item) ? keep(items, item) : item)) : value;
  }
  return kept;
}

export function draftValues(definition: FormDefinition, values: Record<string, unknown>): Record<string, unknown> {
  return keep(valueFields([...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)]), values);
}

const sessionStorageOf = () => (globalThis as { sessionStorage?: DraftStorage }).sessionStorage;

export interface SessionDraftStoreOptions {
  maxAge?: number;
  storage?: () => DraftStorage | undefined;
}

export function sessionDraftStore({ maxAge = WEEK, storage: storageOf = sessionStorageOf }: SessionDraftStoreOptions = {}): DraftStore {
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
