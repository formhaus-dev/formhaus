import type { FieldComponentProps } from '../types';

export function TextareaField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
  onBlur,
  onFocus,
}: FieldComponentProps) {
  const inputId = field.key;
  const helperId = `${field.key}-helper`;
  const errorId = `${field.key}-error`;
  const describedBy = error ? errorId : field.helperText ? helperId : undefined;

  return (
    <div className="fh-field">
      {field.label && (
        <label className="fh-field__label" htmlFor={inputId}>
          {field.label}
          {field.validation?.required && <span className="fh-field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className="fh-field__input fh-field__input--textarea"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        rows={field.rows ?? 3}
        disabled={disabled || loading}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
      {error && (
        <p id={errorId} className="fh-field__error" role="alert">
          {error}
        </p>
      )}
      {!error && field.helperText && (
        <p id={helperId} className="fh-field__helper">
          {field.helperText}
        </p>
      )}
    </div>
  );
}
