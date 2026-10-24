import type { ControlShellProps } from '@formhaus/react/controls';

export function Shell({ kind, f, rootProps, anchors, children }: ControlShellProps) {
  const text = f.required ? f.label : `${f.label} (optional)`;
  const [start, , end] = anchors;
  const notes = (
    <>
      {f.helperText && (
        <div id={f.helperId} className="govuk-hint">
          {f.helperText}
        </div>
      )}
      {start && end && (
        <div className="govuk-hint">
          {start.point} is {start.label.toLowerCase()}, {end.point} is {end.label.toLowerCase()}
        </div>
      )}
      {f.error && (
        <p id={f.errorId} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {f.error}
        </p>
      )}
    </>
  );
  const className = f.invalid ? 'govuk-form-group govuk-form-group--error' : 'govuk-form-group';

  if (kind === 'group')
    return (
      <div className={className}>
        <fieldset {...rootProps} className="govuk-fieldset">
          <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">{text}</legend>
          {notes}
          {children}
        </fieldset>
      </div>
    );

  if (kind === 'inline')
    return (
      <div {...rootProps} className={className}>
        {notes}
        <div className="govuk-checkboxes govuk-checkboxes--small">
          <div className="govuk-checkboxes__item">
            {children}
            <label className="govuk-label govuk-checkboxes__label" htmlFor={f.id}>
              {f.label}
            </label>
          </div>
        </div>
      </div>
    );

  return (
    <div {...rootProps} className={className}>
      <label className="govuk-label govuk-label--s" htmlFor={f.id}>
        {text}
      </label>
      {notes}
      {children}
    </div>
  );
}
