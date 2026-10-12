import type { FormDefinition } from '@formhaus/core';
import type { BackupBase } from '../host';
import { definitionKey } from './baseline';

export interface Backup extends BackupBase {
  definition: FormDefinition;
  revision: number;
  at: string;
}

export interface LoadedDraft extends BackupBase {
  definition: FormDefinition;
  revision: number;
}

export const BACKUP_LIFETIME = 7 * 24 * 60 * 60 * 1000;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isVersion = (value: unknown): value is number | null => value === null || typeof value === 'number';
const isDraft = (value: unknown): value is string | null => value === null || typeof value === 'string';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function clearBackup(key: string, storage: Storage | null = browserStorage()): void {
  try {
    storage?.removeItem(key);
  } catch {
    return;
  }
}

function parse(key: string, storage: Storage | null): Backup | null {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(key) ?? 'null');
    if (!isObject(parsed) || !isObject(parsed.definition) || !isVersion(parsed.version) || !isDraft(parsed.draft)) return null;
    if (typeof parsed.revision !== 'number' || typeof parsed.at !== 'string' || Number.isNaN(Date.parse(parsed.at))) return null;
    const { revision, at, version, draft } = parsed;
    return { definition: parsed.definition as unknown as FormDefinition, revision, at, version, draft };
  } catch {
    return null;
  }
}

export function readBackup(key: string, storage: Storage | null = browserStorage(), now = Date.now()): Backup | null {
  const backup = parse(key, storage);
  if (!backup || now - Date.parse(backup.at) <= BACKUP_LIFETIME) return backup;
  clearBackup(key, storage);
  return null;
}

export function writeBackup(key: string, backup: Backup, storage: Storage | null = browserStorage()): boolean {
  try {
    storage?.setItem(key, JSON.stringify(backup));
    return !!storage;
  } catch {
    return false;
  }
}

export function clearBackups(prefix: string, storage: Storage | null = browserStorage()): void {
  try {
    const keys = Array.from({ length: storage?.length ?? 0 }, (_, index) => storage?.key(index) ?? '');
    for (const key of keys) if (key.startsWith(prefix)) storage?.removeItem(key);
  } catch {
    return;
  }
}

export const sameDefinition = (a: FormDefinition, b: FormDefinition) => definitionKey(a) === definitionKey(b);

export function worthRestoring(backup: Backup, loaded: LoadedDraft): boolean {
  if (backup.version !== loaded.version || backup.draft !== loaded.draft) return false;
  return backup.revision >= loaded.revision && !sameDefinition(backup.definition, loaded.definition);
}
