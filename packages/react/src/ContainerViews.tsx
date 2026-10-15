import type { GroupComponentProps, GroupItemComponentProps, SectionComponentProps } from './types';

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
  remove,
  requestRemove,
  cancelRemove,
  confirming,
  prompt,
  keepLabel,
  removeLabel,
  disabled,
  children,
}: GroupItemComponentProps) {
  return (
    <div className="fh-group__item" role="group" aria-labelledby={titleId}>
      <div className="fh-group__header">
        <span id={titleId} tabIndex={-1} className="fh-group__title">
          {title}
        </span>
        {canRemove && !confirming && (
          <button
            id={`${titleId}-remove`}
            type="button"
            className={`${textButton} fh-group__remove`}
            aria-label={`${removeLabel} ${title}`}
            disabled={disabled}
            onClick={requestRemove}
          >
            {removeLabel}
          </button>
        )}
        {confirming && (
          <div
            className="fh-group__confirm"
            role="group"
            aria-labelledby={`${titleId}-prompt`}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelRemove();
              }
            }}
          >
            <span id={`${titleId}-prompt`} className="fh-group__prompt">
              {prompt}
            </span>
            <span className="fh-group__confirm-actions">
              <button
                id={`${titleId}-confirm`}
                type="button"
                className={`${textButton} fh-group__remove`}
                disabled={disabled}
                onClick={remove}
              >
                {removeLabel}
              </button>
              <button type="button" className={`${textButton} fh-group__keep`} onClick={cancelRemove}>
                {keepLabel}
              </button>
            </span>
          </div>
        )}
      </div>
      <div className="fh-group__fields">{children}</div>
    </div>
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
