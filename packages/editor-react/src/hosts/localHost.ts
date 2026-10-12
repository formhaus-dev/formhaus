import type { FormDefinition } from '@formhaus/core';
import type { EditorHost, SavedDraft } from '../host';
import { baseHost, savedDraft, type HostOptions } from './base';

export const LOCAL_KEY = 'fh:build:v1';

export interface LocalHostOptions extends HostOptions {
  key?: string;
  storage?: Storage;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

export function createLocalHost({ key = LOCAL_KEY, storage = window.localStorage, ...options }: LocalHostOptions): EditorHost {
  const base = baseHost(options);
  return {
    ...base,
    load: () => Promise.resolve({ draft: readLocalDraft(storage, key), published: null }),
    save: (definition, revision) => {
      const draft = savedDraft(definition, revision + 1);
      try {
        storage.setItem(key, JSON.stringify({ definition, revision: draft.revision, savedAt: draft.savedAt }));
      } catch (error) {
        if (quota(error)) {
          base.notify({ title: 'This form is too large to keep in the browser', description: 'Copy or download the JSON to keep it.', tone: 'danger' });
        }
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
      return Promise.resolve(draft);
    },
    discard: () => {
      storage.removeItem(key);
      return Promise.resolve();
    },
    stored: () => storage.getItem(key) !== null,
  };
}
