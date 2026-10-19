import type { LabelKey } from '../types';

export type NodeKind = 'form' | 'step' | 'section' | 'field' | 'group' | 'option' | 'action' | 'validation';

export const SLOTS: Record<NodeKind, readonly string[]> = {
  form: ['title', 'description'],
  step: ['title', 'description'],
  section: ['title', 'description'],
  group: ['label', 'helperText', 'itemLabel', 'addLabel', 'removeLabel'],
  field: ['label', 'placeholder', 'helperText'],
  option: ['label'],
  action: ['label'],
  validation: ['required', 'minLength', 'maxLength', 'min', 'max', 'pattern', 'matchField'],
};

export type Entry = Record<string, unknown>;

export function hasRule(node: Entry, slot: string): boolean {
  const value = node[slot];
  return slot === 'required' ? !!value : value !== undefined && value !== false && value !== '';
}

export const DEFAULT_LABELS: Readonly<Record<LabelKey, string>> = Object.freeze({
  continue: 'Continue',
  back: 'Back',
  stepOf: 'Step {current} of {total}',
  errorSummary: 'Check these answers',
  addItem: 'Add',
  removeItem: 'Remove',
  itemLabel: '{label} {index}',
  itemAdded: '{item} added',
  itemRemoved: '{item} removed',
  removeItemNamed: '{label} {item}',
  removeItemPrompt: 'Remove {item}?',
  removeItemBody: 'This removes {item} and its answers. This cannot be undone.',
  cancel: 'Cancel',
  enlargeImage: 'Enlarge image: {label}',
  close: 'Close',
  clear: 'Clear',
  chooseFile: 'Choose file',
  required: 'required',
  skip: 'Skip',
  submit: 'Submit',
  stepTitle: 'Step {index}',
  stepErrors: 'Errors: {count}',
});
