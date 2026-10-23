import type { FieldComponentProps } from '@formhaus/react';
import { describedBy, FormGroup } from './FormGroup';

export function TextareaField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FormGroup id={id} field={field} error={error}>
      <textarea
        id={id}
        name={field.key}
        rows={field.rows ?? 5}
        className={error ? 'govuk-textarea govuk-textarea--error' : 'govuk-textarea'}
        value={typeof value === 'string' ? value : ''}
        disabled={disabled || loading}
        aria-describedby={describedBy(id, field, error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FormGroup>
  );
}
