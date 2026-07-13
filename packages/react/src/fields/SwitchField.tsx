import type { FieldComponentProps } from '../types';
import { FieldMessage } from './FieldMessage';

export function SwitchField({
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
    <div className="fh-field fh-field--switch">
      <div className="fh-field__switch-wrapper">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className="fh-field__switch"
          checked={!!value}
          disabled={disabled || loading}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          onFocus={onFocus}
        />
        {field.label && (
          <label className="fh-field__label" htmlFor={inputId}>
            {field.label}
          </label>
        )}
      </div>
      <FieldMessage error={error} helperText={field.helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
}
