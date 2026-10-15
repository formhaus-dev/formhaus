import type { FieldType, FormField } from '@formhaus/core';
import { syncIdentifiers, unique } from '../identifiers';
import { clone, isContainer, isPage, isQuestion, newQuestion, setType, span, uid, type BuilderForm, type BuilderQuestion } from '../model';
import { bindReferences, dropReferences, scopeOf } from '../references';
import { canRemove, removeBlock } from './blocks';
import { findField, blockIndex, stepEnd, stepFields } from './locate';

export type Placement = { after: string } | { inside: string } | { step: string | null; index?: number };

export interface FieldPreset {
  type?: FieldType;
  label?: string;
  required?: boolean;
  key?: string;
  extra?: Partial<FormField>;
}

function position(form: BuilderForm, at: Placement): number {
  if ('after' in at || 'inside' in at) {
    const index = blockIndex(form, 'after' in at ? at.after : at.inside);
    return index < 0 ? form.blocks.length : index + span(form, index);
  }
  const end = stepEnd(form, at.step);
  if (at.index === undefined) return end;
  const units = stepFields(form, at.step).filter((item) => !item.parent);
  const unit = units[Math.max(0, at.index)];
  return unit ? blockIndex(form, unit.uid) : end;
}

function parentAt(form: BuilderForm, at: Placement, type: string): string | undefined {
  let owner = findField(form, ('inside' in at ? at.inside : 'after' in at ? findField(form, at.after)?.parent : undefined) ?? '');
  while (owner && (type === 'section' || (type === 'group' && owner.type === 'group'))) owner = findField(form, owner.parent ?? '');
  return owner?.uid;
}

function ancestorIn(form: BuilderForm, uid: string, parent: string | undefined): BuilderQuestion | undefined {
  let item = findField(form, uid);
  while (item && item.parent !== parent) item = findField(form, item.parent ?? '');
  return item;
}

export const childrenOf = (form: BuilderForm, container: string) =>
  form.blocks.filter((block): block is BuilderQuestion => isQuestion(block) && block.parent === container);

export function addField(form: BuilderForm, at: Placement, preset: FieldPreset = {}): BuilderQuestion {
  const question = newQuestion(form, preset.type ?? 'text');
  question.label = preset.label ?? '';
  question.required = preset.required ?? false;
  if (preset.extra) question.extra = clone(preset.extra);
  if (preset.key) {
    question.key = unique(preset.key, new Set(form.blocks.filter(isQuestion).map((item) => item.key)));
    question.keyLocked = true;
  }
  const parent = parentAt(form, at, question.type);
  let index = position(form, at);
  if (parent) question.parent = parent;
  const anchor = 'inside' in at ? at.inside : 'after' in at ? at.after : undefined;
  const unit = anchor && anchor !== parent ? ancestorIn(form, anchor, parent) : undefined;
  if (unit) index = Math.max(index, blockIndex(form, unit.uid) + span(form, blockIndex(form, unit.uid)));
  form.blocks.splice(index, 0, question);
  if (isContainer(question)) {
    const child = newQuestion(form);
    child.parent = question.uid;
    form.blocks.splice(index + 1, 0, child);
  }
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
  const index = blockIndex(form, source);
  if (!findField(form, source)) return undefined;
  const originals = form.blocks.slice(index, index + span(form, index)) as BuilderQuestion[];
  const copies = new Map(
    originals.map((entry): [string, BuilderQuestion] => [
      entry.uid,
      {
        ...clone(entry),
        uid: uid(form),
        keyLocked: false,
        options: entry.options.map((option) => ({ ...option, uid: uid(form), valueLocked: false })),
      },
    ]),
  );
  for (const copy of copies.values()) if (copy.parent) copy.parent = copies.get(copy.parent)?.uid ?? copy.parent;
  form.blocks.splice(index + originals.length, 0, ...copies.values());
  const restore = bindReferences(form, [...copies.values()], (target) => copies.get(target.uid) ?? target);
  syncIdentifiers(form);
  restore();
  return copies.get(source);
}

export function removeField(form: BuilderForm, uid: string): boolean {
  const index = blockIndex(form, uid);
  if (index < 0 || !isQuestion(form.blocks[index])) return false;
  return removeBlock(form, index);
}

export const canRemoveField = (form: BuilderForm, uid: string) => canRemove(form, blockIndex(form, uid));

function unitStart(form: BuilderForm, index: number): number {
  const item = form.blocks[index];
  const top = isQuestion(item) ? ancestorIn(form, item.uid, undefined) : undefined;
  return top ? blockIndex(form, top.uid) : index;
}

export function moveField(form: BuilderForm, uid: string, delta: -1 | 1): boolean {
  const index = blockIndex(form, uid);
  const item = form.blocks[index];
  if (!isQuestion(item)) return false;
  const size = span(form, index);
  const units = form.blocks.splice(index, size);
  const restore = () => {
    form.blocks.splice(index, 0, ...units);
    return false;
  };
  let at: number;
  if (item.parent) {
    let neighbor = delta < 0 ? index - 1 : index;
    while (
      delta < 0 &&
      neighbor > 0 &&
      (form.blocks[neighbor] as BuilderQuestion).parent !== item.parent &&
      (form.blocks[neighbor] as BuilderQuestion).uid !== item.parent
    )
      neighbor--;
    if ((form.blocks[neighbor] as BuilderQuestion | undefined)?.parent !== item.parent) return restore();
    at = delta < 0 ? neighbor : index + span(form, index);
  } else if (delta < 0) {
    if (index === 0 || (index === 1 && isPage(form.blocks[0]))) return restore();
    at = isPage(form.blocks[index - 1]) ? index - 1 : unitStart(form, index - 1);
  } else {
    if (index >= form.blocks.length) return restore();
    at = index + (isPage(form.blocks[index]) ? 1 : span(form, index));
  }
  form.blocks.splice(at, 0, ...units);
  syncIdentifiers(form);
  return true;
}

export function moveFieldTo(form: BuilderForm, uid: string, step: string | null, index: number): boolean {
  const from = blockIndex(form, uid);
  const item = form.blocks[from];
  if (!isQuestion(item)) return false;
  const restore = bindReferences(form);
  const stays = !!item.parent && stepOfIndex(form, blockIndex(form, item.parent)) === step;
  const group = scopeOf(form, item);
  if (!stays && group) dropReferences(form, new Set(childrenOf(form, group).map((child) => child.uid)), [item]);
  const units = form.blocks.splice(from, span(form, from));
  if (stays && item.parent) {
    const siblings = childrenOf(form, item.parent);
    const target = siblings[Math.max(0, index)];
    const owner = blockIndex(form, item.parent);
    form.blocks.splice(target ? blockIndex(form, target.uid) : owner + span(form, owner), 0, ...units);
  } else {
    delete item.parent;
    form.blocks.splice(position(form, { step, index }), 0, ...units);
  }
  syncIdentifiers(form);
  restore();
  return true;
}

function stepOfIndex(form: BuilderForm, index: number): string | null {
  for (let at = index; at >= 0; at--) {
    const block = form.blocks[at];
    if (isPage(block)) return block.uid;
  }
  return null;
}
