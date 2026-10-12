import type { FormStep } from '@formhaus/core';
import { syncIdentifiers } from '../identifiers';
import { dropReferences } from '../references';
import { isPage, isQuestion, newPage, type BuilderForm, type BuilderPage } from '../model';
import { clearTargets, moveBlock, pageCount, pageSpan } from './blocks';
import { blockIndex, findStep } from './locate';

const stepName = (position: number) => `Step ${position}`;
const generic = (title: string) => !title.trim() || /^(Step|Page) \d+$/.test(title.trim());

function wrap(form: BuilderForm): void {
  if (form.blocks.length && !isPage(form.blocks[0])) form.blocks.unshift(newPage(form, stepName(1)));
}

export function addStep(form: BuilderForm, after?: string): BuilderPage {
  wrap(form);
  const index = after ? blockIndex(form, after) : -1;
  const at = index >= 0 ? index + pageSpan(form, index) : form.blocks.length;
  const page = newPage(form, stepName(pageCount(form) + 1));
  form.blocks.splice(at, 0, page);
  syncIdentifiers(form);
  return page;
}

export function splitAt(form: BuilderForm, fieldUid: string): BuilderPage | undefined {
  const index = blockIndex(form, fieldUid);
  if (index <= 0 || isPage(form.blocks[index]) || isPage(form.blocks[index - 1])) return undefined;
  wrap(form);
  const page = newPage(form, stepName(pageCount(form) + 1));
  form.blocks.splice(blockIndex(form, fieldUid), 0, page);
  syncIdentifiers(form);
  return page;
}

export function setStepTitle(form: BuilderForm, uid: string, title: string): void {
  const page = findStep(form, uid);
  if (!page) return;
  page.title = title;
  syncIdentifiers(form);
}

export function setStepLabels(form: BuilderForm, uid: string, labels: { nextLabel?: string; backLabel?: string }): void {
  const page = findStep(form, uid);
  if (!page) return;
  if (labels.nextLabel !== undefined) page.nextLabel = labels.nextLabel;
  if (labels.backLabel !== undefined) page.backLabel = labels.backLabel;
}

export function setStepProp<K extends keyof FormStep>(form: BuilderForm, uid: string, prop: K, value: FormStep[K] | undefined): void {
  const page = findStep(form, uid);
  if (!page) return;
  if (value === undefined || value === '') delete page.extra[prop];
  else page.extra[prop] = value;
}

function collapse(form: BuilderForm): void {
  const only = form.blocks[0];
  if (pageCount(form) !== 1 || !isPage(only)) return;
  if (!generic(only.title) || Object.keys(only.extra).length || only.routes || only.nextLabel || only.backLabel) return;
  form.blocks.shift();
}

export type StepRemoval = 'with-fields' | 'keep-fields';

export function removeStep(form: BuilderForm, uid: string, mode: StepRemoval): boolean {
  const index = blockIndex(form, uid);
  if (index < 0 || !isPage(form.blocks[index]) || pageCount(form) < 2) return false;
  const span = pageSpan(form, index);
  if (mode === 'with-fields') {
    const removed = form.blocks.splice(index, span);
    clearTargets(form, new Set(removed.map((block) => block.uid)));
    dropReferences(form, new Set(removed.filter(isQuestion).map((block) => block.key)));
  } else {
    clearTargets(form, new Set([uid]));
    const [, ...fields] = form.blocks.splice(index, span);
    const target = index === 0 ? 1 : index;
    form.blocks.splice(target, 0, ...fields);
  }
  collapse(form);
  syncIdentifiers(form);
  return true;
}

export function moveStep(form: BuilderForm, uid: string, delta: -1 | 1): boolean {
  const index = blockIndex(form, uid);
  if (index < 0 || !isPage(form.blocks[index])) return false;
  return moveBlock(form, index, delta);
}

export function stepNumber(form: BuilderForm, uid: string): number {
  return form.blocks.filter(isPage).findIndex((page) => page.uid === uid) + (isPage(form.blocks[0]) ? 1 : 2);
}
