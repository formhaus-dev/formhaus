import type { FormDefinition } from '../types';
import { fieldDomId } from './ids';

interface Searchable {
  querySelector(selector: string): unknown;
}

interface Focusable extends Searchable {
  focus(options?: { preventScroll?: boolean }): void;
  scrollIntoView?(options?: { block?: 'center' | 'nearest' }): void;
  matches(selector: string): boolean;
  closest?(selector: string): unknown;
}

interface Active {
  matches(selector: string): boolean;
  isContentEditable?: boolean;
  type?: string;
}

interface FormRoot extends Focusable {
  ownerDocument: { activeElement: unknown; body: unknown };
  contains(node: never): boolean;
}

type Found = Focusable | null | undefined;

const CONTROLS = 'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)';

function firstControl(root: Found): Found {
  return root?.matches(CONTROLS) ? root : root?.querySelector(CONTROLS) as Found;
}

function reveal(target: Focusable, scrollTo: Focusable): void {
  scrollTo.scrollIntoView?.({ block: 'center' });
  target.focus({ preventScroll: true });
}

export function focusProblem(root: Searchable | null, notice?: Focusable | null): void {
  if (notice) return reveal(notice, notice);
  const invalid = root?.querySelector('[aria-invalid="true"]') as Found;
  if (invalid) reveal(firstControl(invalid) ?? invalid, invalid);
}

export function canMoveFocus(form: FormRoot | null | undefined): boolean {
  const active = form?.ownerDocument.activeElement as Active | null | undefined;
  if (!active || !form?.contains(active as never)) return false;
  return !active.isContentEditable && !(active.matches('input, select, textarea') && !['checkbox', 'radio'].includes(active.type!));
}

export function restoreFocus(form: FormRoot | null | undefined, target: (Focusable & { isConnected: boolean }) | null): void {
  const document = form?.ownerDocument;
  if (document && document.activeElement === document.body && target?.isConnected) target.focus();
}

export function focusField(form: FormRoot | null | undefined, formId: string, key: string | null, definition?: FormDefinition): void {
  const fields = form?.querySelector('.fh-form__fields') as Found;
  const id = key && fieldDomId(formId, key, definition);
  const chosen = id ? fields?.querySelector(`[id="${id}"], [id="${id}-error"]`) as Found : null;
  if (id && !chosen) return;
  const field = (chosen?.closest?.('.fh-field') ?? chosen ?? fields?.querySelector('[aria-invalid="true"]')) as Found;
  const target = (field?.querySelector('input:checked:not(:disabled)') as Found) ?? firstControl(field) ?? firstControl(fields);
  (target ?? form)?.focus();
}
