import type { FieldComponentProps } from '@formhaus/react';
import { describedBy, FormGroup } from './FormGroup';

export function SelectField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FormGroup id={id} field={field} error={error}>
      <select
        id={id}
        name={field.key}
        className={error ? 'govuk-select govuk-select--error' : 'govuk-select'}
        value={typeof value === 'string' ? value : ''}
        disabled={disabled || loading}
        aria-describedby={describedBy(id, field, error)}
        onChange={(event) => onChange(event.target.value || undefined)}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        <option value="">{field.placeholder ?? 'Choose an option'}</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormGroup>
  );
}
