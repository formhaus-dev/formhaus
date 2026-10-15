import { useEffect, useRef } from 'react';
import type { ConfirmDialogComponentProps, GroupComponentProps, GroupItemComponentProps, SectionComponentProps } from './types';

export function DefaultSection({ id, title, description, descriptionId, children }: SectionComponentProps) {
  return (
    <fieldset id={id} className="fh-section" aria-describedby={descriptionId}>
      <legend className="fh-section__title">{title}</legend>
      {description && (
        <p id={descriptionId} className="fh-field__helper fh-section__description">
          {description}
        </p>
      )}
      <div className="fh-section__body">{children}</div>
    </fieldset>
  );
}

const textButton = 'fh-form-actions__button fh-form-actions__button--text';

export function DefaultGroupItem({
  title,
  titleId,
  canRemove,
  requestRemove,
  removeLabel,
  removeName,
  disabled,
  children,
}: GroupItemComponentProps) {
  return (
    <div className="fh-group__item" role="group" aria-labelledby={titleId}>
      <div className="fh-group__header">
        <span id={titleId} tabIndex={-1} className="fh-group__title">
          {title}
        </span>
        {canRemove && (
          <button
            id={`${titleId}-remove`}
            type="button"
            className={`${textButton} fh-group__remove`}
            aria-label={removeName}
            disabled={disabled}
            onClick={requestRemove}
          >
            {removeLabel}
          </button>
        )}
      </div>
      <div className="fh-group__fields">{children}</div>
    </div>
  );
}

export function DefaultConfirmDialog({
  id,
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirm,
  cancel,
}: ConfirmDialogComponentProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || open === dialog.open) return;
    if (!open) dialog.close();
    else if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.open = true;
    if (open) dialog.querySelector<HTMLElement>('.fh-dialog__cancel')?.focus();
  }, [open]);
  return (
    <dialog
      ref={ref}
      id={id}
      className="fh-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        cancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <div className="fh-dialog__header">
        <h2 id={`${id}-title`} className="fh-dialog__title">
          {title}
        </h2>
        <p id={`${id}-description`} className="fh-dialog__description">
          {description}
        </p>
        <button type="button" className="fh-dialog__close" aria-label={cancelLabel} onClick={cancel} />
      </div>
      <div className="fh-dialog__footer">
        <button type="button" className={`${textButton} fh-dialog__cancel`} onClick={cancel}>
          {cancelLabel}
        </button>
        <button type="button" className="fh-form-actions__button fh-dialog__danger" onClick={confirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function DefaultGroup({
  id,
  label,
  helperText,
  error,
  describedBy,
  items,
  canAdd,
  add,
  addLabel,
  disabled,
  status,
  ItemComponent,
}: GroupComponentProps) {
  return (
    <fieldset id={id} className="fh-group" aria-invalid={!!error || undefined} aria-describedby={describedBy}>
      <legend className="fh-field__label">{label}</legend>
      {helperText && (
        <p id={`${id}-helper`} className="fh-field__helper fh-group__helper">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="fh-field__error fh-group__error" role="alert">
          {error}
        </p>
      )}
      <div className="fh-group__body">
        {items.map((item) => (
          <ItemComponent key={item.id} {...item} />
        ))}
        {canAdd && (
          <button
            type="button"
            className="fh-form-actions__button fh-form-actions__button--secondary fh-group__add"
            disabled={disabled}
            onClick={add}
          >
            {addLabel}
          </button>
        )}
      </div>
      <p className="fh-group__status" role="status">
        {status}
      </p>
    </fieldset>
  );
}
