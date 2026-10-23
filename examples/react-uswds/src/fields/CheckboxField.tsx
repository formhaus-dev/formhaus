import type { FieldComponentProps } from '@formhaus/react';
import { describedBy, optionId } from './field';
import { FormGroup } from './FormGroup';

export function CheckboxField({
  id = '',
  field,
  value,
  error,
  loading,
  disabled,
  testId,
  optionTestId,
  onChange,
  onBlur,
  onFocus,
}: FieldComponentProps) {
  const multiple = field.type === 'multiselect';
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const items = multiple ? (field.options ?? []) : [{ value: 'true', label: field.label }];

  const boxes = items.map((option, index) => (
    <div key={option.value} className="usa-checkbox">
      <input
        id={optionId(id, index)}
        className="usa-checkbox__input"
        type="checkbox"
        name={field.key}
        value={option.value}
        checked={multiple ? selected.includes(option.value) : value === true}
        disabled={disabled || loading}
        aria-invalid={!multiple && error ? true : undefined}
        aria-describedby={multiple ? undefined : describedBy(id, field, error)}
        data-testid={multiple ? optionTestId?.(option.value) : testId}
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
      <label className="usa-checkbox__label" htmlFor={optionId(id, index)}>
        {option.label}
      </label>
    </div>
  ));

  if (multiple)
    return (
      <FormGroup id={id} field={field} error={error} fieldset>
        {boxes}
      </FormGroup>
    );

  return (
    <div className={error ? 'usa-form-group usa-form-group--error' : 'usa-form-group'} data-fh="field">
      {field.helperText && (
        <div id={`${id}-hint`} className="usa-hint">
          {field.helperText}
        </div>
      )}
      {error && (
        <span id={`${id}-error`} className="usa-error-message" role="alert">
          {error}
        </span>
      )}
      {boxes}
    </div>
  );
}
