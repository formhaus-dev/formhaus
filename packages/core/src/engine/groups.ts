import type { FormField, FormGroup } from '../types';
import { isEntry, isGroup, itemId, itemPath, itemsOf, keepId, splitPath } from '../visibility/nodes';
import { createValues, getChangedKeys } from './engine-utils';
import type { EngineInternals } from './runtime-internals';
import { clearError, clearResolvedMatchErrors } from './validation-state';
import { writeValue } from './write-value';
import { exclusiveWrite } from './exclusive';
import { maxItems } from '../validation/type-checks';

export interface GroupItem {
  id: string;
  fields: FormField[];
}

function activeGroup(engine: EngineInternals, key: string): FormGroup | undefined {
  const field = engine.visibility.activeField(key, engine.state.values);
  return field && isGroup(field) ? field : undefined;
}

export function itemLimits(group: FormGroup): [number, number] {
  const rules = group.validation ?? {};
  return [rules.minLength ?? (rules.required ? 1 : 0), maxItems(group)];
}

const within = (index: number, items: unknown[]) => Number.isInteger(index) && index >= 0 && index < items.length;

export function groupItems(engine: EngineInternals, key: string): GroupItem[] {
  const group = activeGroup(engine, key);
  if (!group) return [];
  return itemsOf(engine.state.values[key]).map((item, index) => ({
    id: itemId(item, index),
    fields: engine.visibility.itemFields(group, item, engine.state.values),
  }));
}

export function addItem(engine: EngineInternals, key: string): boolean {
  const group = activeGroup(engine, key);
  const items = itemsOf(engine.state.values[key]);
  if (!group || items.length >= itemLimits(group)[1]) return false;
  const item = createValues(group.fields);
  engine.visibility.seedItems([item]);
  writeValue(engine, key, [...items, item]);
  return true;
}

function reindex(engine: EngineInternals, key: string, place: (index: number) => number | undefined): void {
  const { errors, serverErrors, fieldLoading } = engine.state;
  for (const record of [errors, serverErrors, fieldLoading] as Record<string, unknown>[]) {
    const moved: Record<string, unknown> = {};
    for (const errorKey of Object.keys(record)) {
      const parts = splitPath(key, errorKey);
      const target = parts && place(parts[0]);
      if (!parts || target === parts[0]) continue;
      if (target !== undefined) moved[itemPath(key, target, parts[1])] = record[errorKey];
      delete record[errorKey];
    }
    Object.assign(record, moved);
  }
}

function writeItems(engine: EngineInternals, key: string, items: unknown[], previous: Record<string, string>): true {
  writeValue(engine, key, items, true, () => getChangedKeys(previous, engine.errors));
  return true;
}

export function removeItem(engine: EngineInternals, key: string, index: number): boolean {
  const group = activeGroup(engine, key);
  const items = itemsOf(engine.state.values[key]);
  if (!group || !within(index, items) || items.length <= itemLimits(group)[0]) return false;
  const previous = { ...engine.errors };
  engine.visibility.dropItem(items[index]);
  reindex(engine, key, (position) => (position === index ? undefined : position - Number(position > index)));
  return writeItems(
    engine,
    key,
    items.filter((_, position) => position !== index),
    previous,
  );
}

export function moveItem(engine: EngineInternals, key: string, from: number, to: number): boolean {
  const group = activeGroup(engine, key);
  const items = [...itemsOf(engine.state.values[key])];
  if (!group || !within(from, items) || !within(to, items) || from === to) return false;
  const previous = { ...engine.errors };
  const shifted = (position: number) => position - Number(position > from);
  reindex(engine, key, (position) => (position === from ? to : shifted(position) + Number(shifted(position) >= to)));
  items.splice(to, 0, ...items.splice(from, 1));
  return writeItems(engine, key, items, previous);
}

export function setItemValue(engine: EngineInternals, key: string, index: number, fieldKey: string, input: unknown): void {
  const group = activeGroup(engine, key);
  const items = itemsOf(engine.state.values[key]);
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
