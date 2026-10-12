import { blockIndex, END, findField, findStep, hasCustomRoutes, pagesAfter, stepOf, type BuilderForm } from '@formhaus/builder';

export interface Target {
  value: string;
  label: string;
}

export const NEXT = '';

export function targetsAfter(form: BuilderForm, uid: string): Target[] {
  const later = pagesAfter(form)[blockIndex(form, uid)] ?? [];
  if (!later.length) return [];
  return [
    { value: NEXT, label: 'Next step' },
    ...later.map((page) => ({ value: page.uid, label: page.title })),
    { value: END, label: 'End form' },
  ];
}

export function branchTargets(form: BuilderForm, fieldUid: string): Target[] {
  const step = stepOf(form, fieldUid);
  if (!step || hasCustomRoutes(form, step.uid)) return [];
  const targets = targetsAfter(form, fieldUid);
  const after = step.next ? targets.find((target) => target.value === step.next) : undefined;
  return after ? targets.map((target) => (target.value === NEXT ? { value: NEXT, label: `Default: ${after.label}` } : target)) : targets;
}

export function setJump(form: BuilderForm, fieldUid: string, optionUid: string, target: string): void {
  const option = findField(form, fieldUid)?.options.find((item) => item.uid === optionUid);
  if (option) option.jump = target || null;
}

export function setNext(form: BuilderForm, stepUid: string, target: string): void {
  const step = findStep(form, stepUid);
  if (step) step.next = target || null;
}
