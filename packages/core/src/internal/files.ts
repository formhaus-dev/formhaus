import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import { type FileText, fileLimit, filesFull } from '../fields/files';
import { fieldAria, fieldId, type FieldStateInput } from '../fields/state';
import type { FormField } from '../types';

export const fileLimitMessage = (engine: FormEngine, field: FormField, max: number): string =>
  field.validation?.maxLengthMessage ?? (engine as unknown as EngineInternals).messages('maxItems', { max }, field);

interface Focusable {
  focus(): void;
}

interface ButtonList {
  querySelectorAll(selector: 'button'): ArrayLike<Focusable>;
}

export const nextRemove = (list: ButtonList | null | undefined, position: number): Focusable | undefined => {
  const buttons = list?.querySelectorAll('button');
  return buttons?.[position] ?? buttons?.[position - 1];
};

export function announce(set: (message: string) => void, message: string): void {
  set('');
  setTimeout(() => set(message), 0);
}

export function fileListAria(input: FieldStateInput & { field: FormField }, value: unknown, picked: string, text: FileText) {
  const id = fieldId(input);
  const noticeId = `${id}-notice`;
  const notice = picked || (filesFull(input.field, value) ? text.limit(input.field, fileLimit(input.field)) : '');
  const describedBy = [fieldAria(input)['aria-describedby'], notice && noticeId].filter(Boolean).join(' ') || undefined;
  return { notice, noticeId, describedBy, list: { role: 'list', 'aria-labelledby': `${id}-label` } };
}
