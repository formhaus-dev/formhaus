import { syncIdentifiers } from '../identifiers';
import { bindReferences } from '../references';
import { newOption, type BuilderForm, type BuilderOption } from '../model';
import { moveItem } from './blocks';
import { findField } from './locate';

export function addOptions(form: BuilderForm, fieldUid: string, labels: string[], after?: string): BuilderOption[] {
  const item = findField(form, fieldUid);
  if (!item) return [];
  const index = after ? item.options.findIndex((option) => option.uid === after) : -1;
  const created = labels.map((label) => newOption(form, label));
  item.options.splice(index >= 0 ? index + 1 : item.options.length, 0, ...created);
  syncIdentifiers(form);
  return created;
}

export const addOption = (form: BuilderForm, fieldUid: string, after?: string, label = '') => addOptions(form, fieldUid, [label], after)[0];

function option(form: BuilderForm, fieldUid: string, optionUid: string) {
  const item = findField(form, fieldUid);
  return item?.options.find((entry) => entry.uid === optionUid);
}

export function setOptionLabel(form: BuilderForm, fieldUid: string, optionUid: string, label: string): void {
  const entry = option(form, fieldUid, optionUid);
  if (!entry) return;
  entry.label = label;
  syncIdentifiers(form);
}

export function setOptionValue(form: BuilderForm, fieldUid: string, optionUid: string, value: string): void {
  const entry = option(form, fieldUid, optionUid);
  if (!entry) return;
  const restore = bindReferences(form);
  entry.value = value;
  entry.valueLocked = true;
  syncIdentifiers(form);
  restore();
}

export function unlockOptionValue(form: BuilderForm, fieldUid: string, optionUid: string): void {
  const entry = option(form, fieldUid, optionUid);
  if (!entry) return;
  entry.valueLocked = false;
  syncIdentifiers(form);
}

export function removeOption(form: BuilderForm, fieldUid: string, optionUid: string): boolean {
  const item = findField(form, fieldUid);
  if (!item || item.options.length < 2) return false;
  const index = item.options.findIndex((entry) => entry.uid === optionUid);
  if (index < 0) return false;
  item.options.splice(index, 1);
  syncIdentifiers(form);
  return true;
}

export function moveOption(form: BuilderForm, fieldUid: string, optionUid: string, to: number): boolean {
  const item = findField(form, fieldUid);
  if (!item) return false;
  const from = item.options.findIndex((entry) => entry.uid === optionUid);
  if (from < 0) return false;
  const at = to > from ? to + 1 : to;
  if (!moveItem(item.options, from, Math.max(0, Math.min(at, item.options.length)))) return false;
  syncIdentifiers(form);
  return true;
}
