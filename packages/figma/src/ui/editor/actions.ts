import type { FormAction, FormDefinition, FormStep } from '@formhaus/core';

function withLabel(action: FormAction | false | undefined, label: string, fallback: string): FormAction | undefined {
  const base = typeof action === 'object' ? action : undefined;
  if (label) return { ...base, label };
  if (!base) return undefined;
  const rest: Partial<FormAction> = { ...base };
  delete rest.label;
  return Object.keys(rest).length > 0 ? { ...rest, label: fallback } : undefined;
}

function assign<K extends 'next' | 'back'>(step: FormStep, key: K, action: FormAction | false | undefined): void {
  if (action === undefined) delete step[key];
  else step[key] = action;
}

export function setNextLabel(step: FormStep, label: string): void {
  assign(step, 'next', withLabel(step.next, label, 'Continue'));
}

export function setBackLabel(step: FormStep, label: string): void {
  assign(step, 'back', withLabel(step.back, label, 'Back'));
}

export function setBackVisible(step: FormStep, visible: boolean): void {
  assign(step, 'back', visible ? undefined : false);
}

export function setNextVisible(step: FormStep, visible: boolean): void {
  assign(step, 'next', visible ? undefined : false);
}

export function setCancel(draft: FormDefinition, label: string | null): void {
  if (label === null) delete draft.cancel;
  else draft.cancel = { ...draft.cancel, label: label || 'Cancel' };
}

export type SkippableStep = FormStep & { skip?: FormAction };

export function setSkip(step: SkippableStep, label: string | null): void {
  if (label === null) delete step.skip;
  else step.skip = { ...step.skip, label: label || 'Skip' };
}
