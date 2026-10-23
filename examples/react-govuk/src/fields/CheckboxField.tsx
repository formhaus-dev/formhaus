import type { FieldComponentProps } from '@formhaus/react';
import { FormGroup } from './FormGroup';

export function CheckboxField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const multiple = field.type === 'multiselect';
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const items = multiple ? (field.options ?? []) : [{ value: 'yes', label: field.label ?? '' }];

  const checkboxes = (
    <div className="govuk-checkboxes govuk-checkboxes--small" data-module="govuk-checkboxes">
      {items.map((option, index) => {
        const optionId = index === 0 ? id : `${id}-${index}`;
        return (
          <div key={option.value} className="govuk-checkboxes__item">
            <input
              id={optionId}
              className="govuk-checkboxes__input"
              name={field.key}
              type="checkbox"
              value={option.value}
              checked={multiple ? selected.includes(option.value) : value === true}
              disabled={disabled || loading}
              aria-describedby={!multiple && error ? `${id}-error` : undefined}
              onChange={(event) =>
                onChange(
                  multiple
                    ? event.target.checked
                      ? [...selected, option.value]
                      : selected.filter((entry) => entry !== option.value)
                    : event.target.checked,
                )
              }
              onBlur={onBlur}
              onFocus={onFocus}
            />
            <label className="govuk-label govuk-checkboxes__label" htmlFor={optionId}>
              {option.label}
            </label>
          </div>
        );
      })}
    </div>
  );

  if (multiple)
    return (
      <FormGroup id={id} field={field} error={error} fieldset>
        {checkboxes}
      </FormGroup>
    );

  return (
    <div className={error ? 'govuk-form-group govuk-form-group--error' : 'govuk-form-group'}>
      {error && (
        <p id={`${id}-error`} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {error}
        </p>
      )}
      {checkboxes}
    </div>
  );
}
