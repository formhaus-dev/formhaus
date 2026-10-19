import type { FormField, FormGroup } from '../types';
import { isEntry, isGroup, itemId, itemPath, itemsOf, keepId, splitPath } from '../visibility/nodes';
import { createValues, getChangedKeys } from './engine-utils';
import type { EngineInternals } from './runtime-internals';
import { clearError, clearResolvedMatchErrors } from './validation-state';
import { writeValue } from './write-value';
import { exclusiveWrite } from './exclusive';

export interface GroupItem {
  id: string;
  fields: FormField[];
}

function activeGroup(engine: EngineInternals, key: string): FormGroup | undefined {
  const field = engine.visibility.activeField(key, engine.values);
  return field && isGroup(field) ? field : undefined;
}

export function itemLimits(group: FormGroup): [number, number] {
  const rules = group.validation ?? {};
  return [rules.minLength ?? (rules.required ? 1 : 0), rules.maxLength ?? 100];
}

const within = (index: number, items: unknown[]) => Number.isInteger(index) && index >= 0 && index < items.length;

export function groupItems(engine: EngineInternals, key: string): GroupItem[] {
  const group = activeGroup(engine, key);
  if (!group) return [];
  return itemsOf(engine.values[key]).map((item, index) => ({
    id: itemId(item, index),
    fields: engine.visibility.itemFields(group, item, engine.values),
  }));
}

export function addItem(engine: EngineInternals, key: string): boolean {
  const group = activeGroup(engine, key);
  const items = itemsOf(engine.values[key]);
  if (!group || items.length >= itemLimits(group)[1]) return false;
  const item = createValues(group.fields);
  engine.visibility.seedItems([item]);
  writeValue(engine, key, [...items, item]);
  return true;
}

function shift(errors: Record<string, string>, key: string, removed: number): void {
  const moved: Record<string, string> = {};
  for (const errorKey of Object.keys(errors)) {
    const parts = splitPath(key, errorKey);
    if (!parts || parts[0] < removed) continue;
    if (parts[0] > removed) moved[itemPath(key, parts[0] - 1, parts[1])] = errors[errorKey];
    delete errors[errorKey];
  }
  Object.assign(errors, moved);
}

export function removeItem(engine: EngineInternals, key: string, index: number): boolean {
  const group = activeGroup(engine, key);
  const items = itemsOf(engine.values[key]);
  if (!group || !within(index, items) || items.length <= itemLimits(group)[0]) return false;
  const previous = { ...engine.errors };
  engine.visibility.dropItem(items[index]);
  shift(engine.state.errors, key, index);
  shift(engine.state.serverErrors, key, index);
  shift(engine.state.fieldLoading as unknown as Record<string, string>, key, index);
  writeValue(
    engine,
    key,
    items.filter((_, position) => position !== index),
    true,
    () => getChangedKeys(previous, engine.errors),
  );
  return true;
}

export function setItemValue(engine: EngineInternals, key: string, index: number, fieldKey: string, input: unknown): void {
  const group = activeGroup(engine, key);
  const items = itemsOf(engine.values[key]);
  const field = group?.fields.find((candidate) => candidate.key === fieldKey);
  if (!group || !field || !within(index, items)) return;
  const current = items[index];
  const item = isEntry(current) ? current : {};
  const value = exclusiveWrite(field, item[fieldKey], input);
  const path = itemPath(key, index, fieldKey);
  const changed = !Object.is(item[fieldKey], value);
  const previousError = engine.errors[path];
  let next = items;
  engine.visibility.rememberItem(current, fieldKey, value);
  if (changed) {
    const updated = keepId(current, { ...item, [fieldKey]: value });
    next = items.map((entry, position) => (position === index ? updated : entry));
  }
  clearError(engine, path, changed);
  writeValue(engine, key, next, false, () => [
    ...(changed || previousError !== engine.errors[path] ? [path] : []),
    ...clearResolvedMatchErrors(engine, fieldKey, { group, index, field }),
  ]);
}
