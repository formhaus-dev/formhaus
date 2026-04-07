import type { FieldComponentProps } from '../types';

export function FileField({
  field,
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
      <input
        id={inputId}
        type="file"
        className="fh-field__input fh-field__input--file"
        accept={field.accept}
        disabled={disabled || loading}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => {
          const files = e.target.files;
          onChange(files && files.length > 0 ? files[0] : null);
        }}
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
