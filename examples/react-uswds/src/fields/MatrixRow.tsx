import { type FieldComponentProps, fieldProps } from '@formhaus/react';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <div
      className={f.invalid ? 'usa-form-group usa-form-group--error matrix__row' : 'usa-form-group matrix__row'}
      data-fh="field"
      role="radiogroup"
      aria-labelledby={`${f.id}-label`}
      aria-describedby={f.describedBy}
    >
      <span id={`${f.id}-label`} className="matrix__label">
        {f.label}
      </span>
      {f.options.map((option, index) => {
        const attrs = f.option(option, index);
        return (
          <div key={option.value} className="usa-radio matrix__cell">
            <input
              {...attrs}
              type="radio"
              className="usa-radio__input"
              aria-invalid={f.aria['aria-invalid']}
              onChange={() => f.change(option.value)}
            />
            <label className="usa-radio__label" htmlFor={attrs.id}>
              <span className="usa-sr-only">{option.label}</span>
            </label>
          </div>
        );
      })}
      {f.helperText && (
        <span id={f.helperId} className="usa-hint matrix__hint">
          {f.helperText}
        </span>
      )}
      {f.error && (
        <span id={f.errorId} className="usa-error-message matrix__error" role="alert">
          {f.error}
        </span>
      )}
    </div>
  );
}
