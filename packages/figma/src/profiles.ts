import { PLUGIN_NAMESPACE, readConfig, writeConfig, type Binding, type PluginConfig } from './config';
import { ROLES, type Role } from './roles';

export type ProfileBindings = Partial<Record<Role, Binding>>;

export interface Profile {
  id: string;
  name: string;
  bindings: ProfileBindings;
  origin?: string;
  useInNewFiles?: boolean;
}

const STORAGE_KEY = 'formhaus-profiles';
const DOCUMENT_KEY = 'documentId';

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function documentId(): string {
  const existing = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, DOCUMENT_KEY);
  if (existing) return existing;
  const id = newId();
  figma.root.setSharedPluginData(PLUGIN_NAMESPACE, DOCUMENT_KEY, id);
  return id;
}

export async function listProfiles(): Promise<Profile[]> {
  const stored = await figma.clientStorage.getAsync(STORAGE_KEY).catch(() => undefined);
  return Array.isArray(stored) ? (stored as Profile[]) : [];
}

let queue: Promise<void> = Promise.resolve();

export function updateProfiles(change: (profiles: Profile[]) => Profile[]): Promise<void> {
  queue = queue.catch(() => undefined).then(async () => {
    await figma.clientStorage.setAsync(STORAGE_KEY, change(await listProfiles()));
  });
  return queue;
}

const MAX_TEXT = 200;
const MAX_ENTRIES = 40;

function shortString(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_TEXT;
}

function cleanRecord<T>(value: unknown, accept: (item: unknown) => item is T): Record<string, T> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const entries = Object.entries(value).filter(([key, item]) => key.length <= MAX_TEXT && accept(item)).slice(0, MAX_ENTRIES);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function cleanBinding(value: unknown, keepIds: boolean): Binding | null {
  const binding = value as Partial<Binding> | null;
  if (!binding || !shortString(binding.key)) return null;
  const local = keepIds && binding.source === 'local' && shortString(binding.id);
  const clean: Binding = { source: local ? 'local' : 'library', key: binding.key };
  if (local) clean.id = binding.id;
  if (shortString(binding.name)) clean.name = binding.name;
  const properties = cleanRecord(binding.properties, (item): item is string | boolean => typeof item === 'boolean' || shortString(item));
  if (properties) clean.properties = properties;
  const text = cleanRecord(binding.text, shortString);
  if (text) clean.text = text;
  return clean;
}

function keyed(bindings: ProfileBindings, keepIds: boolean): ProfileBindings {
  const entries = ROLES
    .map((role) => [role, cleanBinding(bindings[role], keepIds)] as const)
    .filter((entry): entry is readonly [Role, Binding] => Boolean(entry[1]));
  return Object.fromEntries(entries) as ProfileBindings;
}

export function importedProfile(input: unknown): Profile | null {
  const candidate = input as Partial<Profile> | null;
  if (!candidate || typeof candidate.name !== 'string' || !candidate.bindings || typeof candidate.bindings !== 'object') return null;
  const bindings = keyed(candidate.bindings, false);
  if (Object.keys(bindings).length === 0) return null;
  return { id: newId(), name: candidate.name.trim().slice(0, 80) || 'Design system', bindings };
}

export async function saveProfile(name: string, bindings: ProfileBindings, useInNewFiles?: boolean): Promise<Profile> {
  const kept = keyed(bindings, true);
  if (Object.keys(kept).length === 0) throw new Error('Bind at least one component before saving a design system.');
  const profiles = await listProfiles();
  const profile: Profile = { id: newId(), name: name.trim().slice(0, 80) || 'Design system', bindings: kept, origin: documentId(), useInNewFiles: useInNewFiles ?? profiles.length === 0 };
  await updateProfiles((list) => [...list.map((item) => (profile.useInNewFiles ? { ...item, useInNewFiles: false } : item)), profile]);
  return profile;
}

export async function addProfile(profile: Profile): Promise<void> {
  await updateProfiles((list) => [...list, profile]);
}

export function applyBindings(config: PluginConfig, profile: Profile): void {
  config.bindings = keyed(profile.bindings, profile.origin === documentId());
  config.source = 'custom';
}

export async function applyDefaultProfile(): Promise<string | null> {
  if (figma.root.getSharedPluginData(PLUGIN_NAMESPACE, 'config')) return null;
  const profile = (await listProfiles()).find((item) => item.useInNewFiles);
  if (!profile) return null;
  const config = readConfig();
  applyBindings(config, profile);
  writeConfig(config);
  return profile.name;
}
