import type { FieldComponentProps } from '@formhaus/react';
import { describedBy, FormGroup } from './FormGroup';

export function FileField({ id, field, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FormGroup id={id} field={field} error={error}>
      <input
        id={id}
        name={field.key}
        type="file"
        accept={field.accept}
        className={error ? 'govuk-file-upload govuk-file-upload--error' : 'govuk-file-upload'}
        disabled={disabled || loading}
        aria-describedby={describedBy(id, field, error)}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FormGroup>
  );
}
