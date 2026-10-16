import type { FormDefinition } from '../types';
import { itemDomId } from './ids';

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
const GROUP_ITEM = '[data-fh-group-item], .fh-group__item';
const GROUP_ADD = '[data-fh-group-add], .fh-group__add';

function firstControl(root: Found, group = root?.matches('.fh-group')): Found {
  if (root && group) return (root.querySelector(GROUP_ADD) as Found) ?? (root.querySelector(CONTROLS) as Found);
  return root?.matches(CONTROLS) ? root : (root?.querySelector(CONTROLS) as Found);
}

function reveal(target: Focusable, scrollTo: Focusable): void {
  scrollTo.scrollIntoView?.({ block: 'center' });
  target.focus({ preventScroll: true });
}

export function focusProblem(root: Searchable | null, notice?: Focusable | null): void {
  const invalid = notice ?? (root?.querySelector('[aria-invalid="true"]') as Found);
  if (invalid) reveal(notice ?? firstControl(invalid) ?? invalid, invalid);
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

export function focusField(form: FormRoot | null | undefined, id: string | null): void {
  const fields = form?.querySelector('.fh-form__fields') as Found;
  const chosen = id ? (fields?.querySelector(`[id="${id}"], [id="${id}-error"]`) as Found) : null;
  if (id && !chosen) return;
  const field = (chosen?.closest?.('.fh-field, .fh-group') ?? chosen ?? fields?.querySelector('[aria-invalid="true"]')) as Found;
  const group = !!field && (field.matches('.fh-group') || !!field.querySelector(GROUP_ADD));
  const target =
    (!group && (field?.querySelector('input:checked:not(:disabled)') as Found)) || firstControl(field, group) || firstControl(fields);
  (target ?? form)?.focus();
}

export function focusItem(
  document: { getElementById(id: string): unknown },
  root: Searchable | null | undefined,
  formId: string,
  group: string,
  index: number,
  added: boolean,
  definition?: FormDefinition,
): void {
  const item = document.getElementById(itemDomId(formId, group, index, undefined, definition)) as Focusable | null;
  const next = (
    added ? ((item?.closest?.(GROUP_ITEM) as Searchable | null | undefined)?.querySelector('input, select, textarea') ?? item) : item
  ) as Found;
  (
    next ??
    (root?.querySelector(GROUP_ADD) as Found) ??
    (document.getElementById(itemDomId(formId, group, index - 1, undefined, definition)) as Found)
  )?.focus();
}
