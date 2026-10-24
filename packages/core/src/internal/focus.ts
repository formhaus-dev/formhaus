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
  querySelectorAll(selector: string): ArrayLike<unknown>;
}

type Found = Focusable | null | undefined;

const ENABLED = ':not(:disabled):not([tabindex="-1"]):not([aria-disabled=true])';
const FIELD_CONTROLS = ['input:not([type=hidden])', 'select', 'textarea', '[tabindex]'].map((control) => control + ENABLED).join();
const CONTROLS = `${FIELD_CONTROLS},button${ENABLED}`;
const GROUP_ITEM = '[data-fh-group-item], .fh-group__item';
const GROUP_ADD = '[data-fh-group-add], .fh-group__add';
const GROUP = '[data-fh="group"], .fh-group';
const FIELD = `[data-fh="field"], ${GROUP}, .fh-field`;
const SUMMARY = '[data-fh="error-summary"], .fh-error-summary';
const HEADING = ':is([data-fh="progress"], .fh-step-progress) :is(h1, h2, h3, h4, h5, h6)';
const OUTSIDE = '[data-fh="progress"], [data-fh="actions"], [data-fh="error-summary"]';

interface Radio extends Focusable {
  type?: string;
  name?: string;
  checked?: boolean;
}

function checkedPeer(root: Found, control: Found): Found {
  const radio = control as Radio | null | undefined;
  if (!root || radio?.type !== 'radio' || radio.checked) return control;
  const peers = (root as unknown as { querySelectorAll?(selector: string): ArrayLike<Radio> }).querySelectorAll?.(
    `input[type=radio]:checked${ENABLED}`,
  );
  return Array.from(peers ?? []).find((peer) => peer.name === radio.name) ?? control;
}

function firstControl(root: Found, group = root?.matches(GROUP)): Found {
  if (root && group) return (root.querySelector(GROUP_ADD) as Found) ?? (root.querySelector(CONTROLS) as Found);
  return root?.matches(CONTROLS) ? root : checkedPeer(root, root?.querySelector(CONTROLS) as Found);
}

function reveal(target: Focusable, scrollTo: Focusable): void {
  scrollTo.scrollIntoView?.({ block: 'center' });
  target.focus({ preventScroll: true });
}

const SEVERAL = '.fh-error-summary__list > li + li, .fh-error-summary__list ~ .fh-error-summary__list';

function summaryOf(root: Searchable | null | undefined, several?: () => boolean): Found {
  const summary = root?.querySelector(SUMMARY) as Found;
  return summary && (several ? several() : summary.querySelector(SEVERAL)) ? summary : undefined;
}

function fieldsOf(form: FormRoot | null | undefined): Found {
  const fields = form?.querySelector('[data-fh="fields"], .fh-form__fields') as Found;
  if (fields || !form) return fields;
  const inside = (selector: string) => Array.from(form.querySelectorAll(selector)).filter((node) => !(node as Focusable).closest!(OUTSIDE));
  return {
    querySelectorAll: inside,
    querySelector: (selector: string) => inside(selector)[0],
    matches: () => false,
  } as unknown as Focusable;
}

export function focusProblem(
  root: Searchable | null,
  notice?: (Focusable & { ownerDocument?: { activeElement: unknown } }) | null,
  several?: () => boolean,
): void {
  if (notice) reveal(notice, notice);
  if (notice && notice.ownerDocument?.activeElement === notice) return;
  const target = summaryOf(root, several);
  const invalid = target ?? (root?.querySelector('[aria-invalid="true"]') as Found);
  if (invalid) reveal(target ?? firstControl(invalid) ?? invalid, invalid);
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

export function focusField(
  form: FormRoot | null | undefined,
  id: string | null,
  afterErrors = false,
  several?: () => boolean,
  toHeading = false,
): void {
  if (toHeading && !id && !afterErrors) {
    const heading = form?.querySelector(HEADING) as (Focusable & { hasAttribute(name: string): boolean; tabIndex: number }) | null;
    if (heading && !heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    (heading ?? form)?.focus();
    return;
  }
  const fields = fieldsOf(form);
  const summary = !id && afterErrors && fields?.querySelector('[aria-invalid="true"]') ? summaryOf(form, several) : undefined;
  if (summary) {
    reveal(summary, summary);
    return;
  }
  const chosen = id ? (fields?.querySelector(`[id="${id}"], [id="${id}-error"]`) as Found) : null;
  if (id && !chosen) return;
  const field = (chosen?.closest?.(FIELD) ?? chosen ?? fields?.querySelector('[aria-invalid="true"]')) as Found;
  const group = !!field && (field.matches(GROUP) || !!field.querySelector(GROUP_ADD));
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
    added ? ((item?.closest?.(GROUP_ITEM) as Searchable | null | undefined)?.querySelector(FIELD_CONTROLS) ?? item) : item
  ) as Found;
  (
    next ??
    (root?.querySelector(GROUP_ADD) as Found) ??
    (document.getElementById(itemDomId(formId, group, index - 1, undefined, definition)) as Found)
  )?.focus();
}
