import type { FieldComponentProps } from '@formhaus/react';
import { describedBy } from './field';
import { FormGroup } from './FormGroup';

export function TextareaField({ id = '', field, value, error, loading, disabled, testId, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FormGroup id={id} field={field} error={error}>
      <textarea
        id={id}
        name={field.key}
        rows={field.rows ?? 5}
        placeholder={field.placeholder}
        className={error ? 'usa-textarea usa-input--error' : 'usa-textarea'}
        value={typeof value === 'string' ? value : ''}
        disabled={disabled || loading}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, field, error)}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FormGroup>
  );
}
