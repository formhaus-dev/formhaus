import type { FieldComponentProps } from '../types';

export function TextField({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(field.type === 'number' ? Number(v) : v);
  };

  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'phone'
        ? 'tel'
        : field.type === 'number'
          ? 'number'
          : field.type === 'password'
            ? 'password'
            : 'text';

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
        type={inputType}
        className="fh-field__input"
        value={value != null ? String(value) : ''}
        placeholder={field.placeholder ?? field.mask}
        disabled={disabled || loading}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={handleChange}
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
