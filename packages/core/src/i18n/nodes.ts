import type { LabelKey } from '../types';

export type NodeKind = 'form' | 'step' | 'field' | 'option' | 'action' | 'validation';

export const SLOTS: Record<NodeKind, readonly string[]> = {
  form: ['title', 'description'],
  step: ['title', 'description'],
  field: ['label', 'placeholder', 'helperText'],
  option: ['label'],
  action: ['label'],
  validation: ['required', 'minLength', 'maxLength', 'min', 'max', 'pattern', 'matchField'],
};

export type Entry = Record<string, unknown>;

export function hasRule(node: Entry, slot: string): boolean {
  return node[slot] !== undefined && node[slot] !== false;
}

export const DEFAULT_LABELS: Readonly<Record<LabelKey, string>> = Object.freeze({
  continue: 'Continue',
  back: 'Back',
  stepOf: 'Step {current} of {total}',
  errorSummary: 'Check these answers',
});
