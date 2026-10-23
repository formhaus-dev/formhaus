import type { FieldComponentProps } from '@formhaus/react';
import { describedBy } from './field';
import { FormGroup } from './FormGroup';

export function SelectField({ id = '', field, value, error, loading, disabled, testId, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FormGroup id={id} field={field} error={error}>
      <select
        id={id}
        name={field.key}
        autoComplete={field.autocomplete}
        className={error ? 'usa-select usa-input--error' : 'usa-select'}
        value={typeof value === 'string' ? value : ''}
        disabled={disabled || loading}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, field, error)}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        <option value="">{field.placeholder ?? '- Select -'}</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormGroup>
  );
}
