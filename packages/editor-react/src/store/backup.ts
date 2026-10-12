import type { FormDefinition } from '@formhaus/core';
import { definitionKey } from './baseline';

export interface Backup {
  definition: FormDefinition;
  revision: number;
  at: string;
}

export interface LoadedDraft {
  definition: FormDefinition;
  revision: number;
  savedAt: string | null;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readBackup(key: string, storage: Storage | null = browserStorage()): Backup | null {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(key) ?? 'null');
    if (!isObject(parsed) || !isObject(parsed.definition)) return null;
    if (typeof parsed.revision !== 'number' || typeof parsed.at !== 'string' || Number.isNaN(Date.parse(parsed.at))) return null;
    return { definition: parsed.definition as unknown as FormDefinition, revision: parsed.revision, at: parsed.at };
  } catch {
    return null;
  }
}

export function writeBackup(key: string, backup: Backup, storage: Storage | null = browserStorage()): boolean {
  try {
    storage?.setItem(key, JSON.stringify(backup));
    return !!storage;
  } catch {
    return false;
  }
}

export function clearBackup(key: string, storage: Storage | null = browserStorage()): void {
  try {
    storage?.removeItem(key);
  } catch {
    return;
  }
}

export const sameDefinition = (a: FormDefinition, b: FormDefinition) => definitionKey(a) === definitionKey(b);

export function worthRestoring(backup: Backup, loaded: LoadedDraft): boolean {
  if (sameDefinition(backup.definition, loaded.definition)) return false;
  if (backup.revision >= loaded.revision || loaded.savedAt === null) return true;
  return Date.parse(backup.at) > Date.parse(loaded.savedAt);
}
