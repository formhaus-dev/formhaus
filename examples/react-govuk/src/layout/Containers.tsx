import type { ConfirmDialogComponentProps, GroupComponentProps, GroupItemComponentProps, SectionComponentProps } from '@formhaus/react';

export function Section({ id, title, description, descriptionId, children }: SectionComponentProps) {
  return (
    <fieldset id={id} className="govuk-fieldset govuk-!-margin-bottom-6" aria-describedby={descriptionId}>
      <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">{title}</legend>
      {description && (
        <div id={descriptionId} className="govuk-hint">
          {description}
        </div>
      )}
      {children}
    </fieldset>
  );
}

export function Group({
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
  itemComponent: Item,
}: GroupComponentProps) {
  return (
    <div className={error ? 'govuk-form-group govuk-form-group--error' : 'govuk-form-group'}>
      <fieldset id={id} className="govuk-fieldset" aria-describedby={describedBy}>
        <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">{label}</legend>
        {helperText && (
          <div id={`${id}-helper`} className="govuk-hint">
            {helperText}
          </div>
        )}
        {error && (
          <p id={`${id}-error`} className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span> {error}
          </p>
        )}
        {items.map((item) => (
          <Item key={item.id} {...item} />
        ))}
        {canAdd && (
          <button
            type="button"
            className="govuk-button govuk-button--secondary"
            data-module="govuk-button"
            disabled={disabled}
            onClick={add}
          >
            {addLabel}
          </button>
        )}
        <p className="govuk-visually-hidden" role="status">
          {status}
        </p>
      </fieldset>
    </div>
  );
}

export function GroupItem({
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
    <div className="govuk-summary-card" role="group" aria-labelledby={titleId}>
      <div className="govuk-summary-card__title-wrapper">
        <h2 id={titleId} className="govuk-summary-card__title" tabIndex={-1}>
          {title}
        </h2>
        {canRemove && (
          <ul className="govuk-summary-card__actions">
            <li className="govuk-summary-card__action">
              <button
                type="button"
                className="govuk-link govuk-body govuk-!-margin-0 app-link-button"
                disabled={disabled}
                onClick={requestRemove}
              >
                {removeLabel}
                <span className="govuk-visually-hidden"> {removeName}</span>
              </button>
            </li>
          </ul>
        )}
      </div>
      <div className="govuk-summary-card__content">{children}</div>
    </div>
  );
}

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  if (!open) return null;
  return (
    <div id={id} className="govuk-notification-banner" role="alertdialog" aria-labelledby={`${id}-title`}>
      <div className="govuk-notification-banner__header">
        <h2 id={`${id}-title`} className="govuk-notification-banner__title">
          {title}
        </h2>
      </div>
      <div className="govuk-notification-banner__content">
        <p className="govuk-body">{description}</p>
        <div className="govuk-button-group">
          <button type="button" className="govuk-button govuk-button--warning" data-module="govuk-button" onClick={confirm}>
            {confirmLabel}
          </button>
          <button type="button" className="govuk-button govuk-button--secondary" data-module="govuk-button" onClick={cancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
