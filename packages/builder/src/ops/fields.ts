import type { FieldType, FormField } from '@formhaus/core';
import { syncIdentifiers, unique } from '../identifiers';
import { clone, isQuestion, newQuestion, setType, uid, type BuilderForm, type BuilderQuestion } from '../model';
import { canRemove, moveBlock, removeBlock } from './blocks';
import { findField, blockIndex, stepEnd, stepFields } from './locate';

export type Placement = { after: string } | { step: string | null; index?: number };

export interface FieldPreset {
  type?: FieldType;
  label?: string;
  required?: boolean;
  key?: string;
  extra?: Partial<FormField>;
}

function position(form: BuilderForm, at: Placement): number {
  if ('after' in at) {
    const index = blockIndex(form, at.after);
    return index < 0 ? form.blocks.length : index + 1;
  }
  const end = stepEnd(form, at.step);
  if (at.index === undefined) return end;
  const count = stepFields(form, at.step).length;
  return end - count + Math.max(0, Math.min(at.index, count));
}

export function addField(form: BuilderForm, at: Placement, preset: FieldPreset = {}): BuilderQuestion {
  const question = newQuestion(form, preset.type ?? 'text');
  question.label = preset.label ?? '';
  question.required = preset.required ?? false;
  if (preset.extra) question.extra = clone(preset.extra);
  if (preset.key) {
    question.key = unique(preset.key, new Set(form.blocks.filter(isQuestion).map((item) => item.key)));
    question.keyLocked = true;
  }
  form.blocks.splice(position(form, at), 0, question);
  syncIdentifiers(form);
  return question;
}

export function setLabel(form: BuilderForm, uid: string, label: string): void {
  const item = findField(form, uid);
  if (!item) return;
  item.label = label;
  syncIdentifiers(form);
}

export function setRequired(form: BuilderForm, uid: string, required: boolean): void {
  const item = findField(form, uid);
  if (item) item.required = required;
}

export function setFieldType(form: BuilderForm, uid: string, type: FieldType): void {
  const item = findField(form, uid);
  if (!item) return;
  setType(form, item, type);
  syncIdentifiers(form);
}

export function setKey(form: BuilderForm, uid: string, key: string): void {
  const item = findField(form, uid);
  if (!item) return;
  item.key = key;
  item.keyLocked = true;
  syncIdentifiers(form);
}

export function unlockKey(form: BuilderForm, uid: string): void {
  const item = findField(form, uid);
  if (!item) return;
  item.keyLocked = false;
  syncIdentifiers(form);
}

export function setFieldProp<K extends keyof FormField>(form: BuilderForm, uid: string, prop: K, value: FormField[K] | undefined): void {
  const item = findField(form, uid);
  if (!item) return;
  if (value === undefined || value === '') delete item.extra[prop];
  else item.extra[prop] = value;
}

export function duplicateField(form: BuilderForm, source: string): BuilderQuestion | undefined {
  const item = findField(form, source);
  if (!item) return undefined;
  const copy: BuilderQuestion = {
    ...clone(item),
    uid: uid(form),
    key: '',
    keyLocked: false,
    options: item.options.map((option) => ({ ...option, uid: uid(form), valueLocked: false })),
  };
  form.blocks.splice(blockIndex(form, source) + 1, 0, copy);
  syncIdentifiers(form);
  return copy;
}

export function removeField(form: BuilderForm, uid: string): boolean {
  const index = blockIndex(form, uid);
  if (index < 0 || !isQuestion(form.blocks[index])) return false;
  return removeBlock(form, index);
}

export const canRemoveField = (form: BuilderForm, uid: string) => canRemove(form, blockIndex(form, uid));

export function moveField(form: BuilderForm, uid: string, delta: -1 | 1): boolean {
  const index = blockIndex(form, uid);
  return index >= 0 && moveBlock(form, index, delta);
}

export function moveFieldTo(form: BuilderForm, uid: string, step: string | null, index: number): boolean {
  const from = blockIndex(form, uid);
  if (from < 0 || !isQuestion(form.blocks[from])) return false;
  const [item] = form.blocks.splice(from, 1);
  form.blocks.splice(position(form, { step, index }), 0, item);
  syncIdentifiers(form);
  return true;
}
