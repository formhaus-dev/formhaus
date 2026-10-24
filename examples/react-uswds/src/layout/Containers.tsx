import type { FieldsContainerProps, GroupComponentProps, GroupItemComponentProps, SectionComponentProps } from '@formhaus/react';
import type { CSSProperties } from 'react';

export function FieldsContainer({ rootProps, children }: FieldsContainerProps) {
  return (
    <div {...rootProps} className="usa-form usa-form--large">
      {children}
    </div>
  );
}

export function Section({ id, title, description, descriptionId, columns, children }: SectionComponentProps) {
  return (
    <fieldset
      id={id}
      className={columns ? 'usa-fieldset section matrix' : 'usa-fieldset section'}
      aria-describedby={descriptionId}
      style={columns && ({ '--matrix-columns': columns.length } as CSSProperties)}
    >
      <legend className="usa-legend section__title">{title}</legend>
      {description && (
        <p id={descriptionId} className="usa-hint">
          {description}
        </p>
      )}
      {columns && (
        <div className="matrix__row matrix__header" aria-hidden="true">
          <span />
          {columns.map((option) => (
            <span key={option.value} className="matrix__cell">
              {option.label}
            </span>
          ))}
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
    <fieldset
      id={id}
      className={error ? 'usa-fieldset usa-form-group--error section' : 'usa-fieldset section'}
      data-fh="group"
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend className="usa-legend section__title">{label}</legend>
      {helperText && (
        <p id={`${id}-helper`} className="usa-hint">
          {helperText}
        </p>
      )}
      {error && (
        <span id={`${id}-error`} className="usa-error-message" role="alert">
          {error}
        </span>
      )}
      <ul className="usa-card-group group__items">
        {items.map((item) => (
          <Item key={item.id} {...item} />
        ))}
      </ul>
      {canAdd && (
        <button type="button" className="usa-button usa-button--outline" disabled={disabled} data-fh-group-add onClick={add}>
          {addLabel}
        </button>
      )}
      <p className="usa-sr-only" role="status">
        {status}
      </p>
    </fieldset>
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
    <li className="usa-card group__item" data-fh-group-item>
      <div className="usa-card__container" role="group" aria-labelledby={titleId}>
        <div className="usa-card__header">
          <h3 id={titleId} tabIndex={-1} className="usa-card__heading">
            {title}
          </h3>
        </div>
        <div className="usa-card__body">{children}</div>
        {canRemove && (
          <div className="usa-card__footer">
            <button
              id={`${titleId}-remove`}
              type="button"
              className="usa-button usa-button--unstyled"
              aria-label={removeName}
              disabled={disabled}
              onClick={requestRemove}
            >
              {removeLabel}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
