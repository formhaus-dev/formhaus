import type { FormDefinition } from '@formhaus/core';
import type { EditorHost, SavedDraft } from '../host';
import { clearBackup, sameDefinition, writeBackup } from '../store/backup';
import { baseHost, savedDraft, type HostOptions } from './base';

export const LOCAL_KEY = 'fh:build:v1';

export const backupKey = (key: string) => `${key}:backup`;

export interface LocalHostOptions extends HostOptions {
  key?: string;
  storage?: Storage;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function readLocalDraft(storage: Storage, key = LOCAL_KEY): SavedDraft | null {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? 'null');
    if (!isObject(parsed) || !isObject(parsed.definition) || typeof parsed.revision !== 'number') return null;
    const savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString();
    return { ...savedDraft(parsed.definition as unknown as FormDefinition, parsed.revision), savedAt };
  } catch {
    return null;
  }
}

const quota = (error: unknown) => error instanceof DOMException && error.name === 'QuotaExceededError';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createLocalHost({
  key = LOCAL_KEY,
  storage = browserStorage() ?? undefined,
  onChange,
  definition,
  ...options
}: LocalHostOptions): EditorHost {
  const base = baseHost(options);
  let warned = false;
  const attempt = <T>(run: (store: Storage) => T, fallback: T): T => {
    try {
      return storage ? run(storage) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    ...base,
    backup: { key: () => backupKey(key), mirror: false, base: () => ({ version: null, draft: null }) },
    load: () =>
      Promise.resolve({
        draft: (storage && readLocalDraft(storage, key)) ?? (definition ? savedDraft(definition, 0) : null),
        published: null,
      }),
    save: (definition, revision) => {
      const draft = savedDraft(definition, revision + 1);
      try {
        if (!storage) throw new Error('Browser storage is not available');
        storage.setItem(key, JSON.stringify({ definition, revision: draft.revision, savedAt: draft.savedAt }));
      } catch (error) {
        if (quota(error) && !warned) {
          warned = true;
          base.notify({
            title: 'This form is too large to keep in the browser',
            description: 'Copy or download the JSON to keep it.',
            tone: 'danger',
          });
        }
        return Promise.reject(new Error(error instanceof Error ? error.message : String(error)));
      }
      warned = false;
      onChange?.(definition);
      return Promise.resolve(draft);
    },
    discard: () => {
      attempt((store) => {
        store.removeItem(key);
      }, undefined);
      return Promise.resolve();
    },
    stored: () => attempt((store) => store.getItem(key) !== null, false),
  };
}

export function carryToBuild(definition: FormDefinition, storage: Storage | null = browserStorage()): void {
  if (!storage) return;
  const current = readLocalDraft(storage);
  const at = new Date().toISOString();
  try {
    if (!current) {
      storage.setItem(LOCAL_KEY, JSON.stringify({ definition, revision: 1, savedAt: at }));
      clearBackup(backupKey(LOCAL_KEY), storage);
      return;
    }
  } catch {
    return;
  }
  if (!sameDefinition(current.definition, definition)) writeBackup(backupKey(LOCAL_KEY), { definition, revision: current.revision, at, version: null, draft: null }, storage);
}
