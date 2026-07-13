import type { FieldComponentProps } from '../types';
import { FieldLabel } from './FieldLabel';
import { FieldMessage } from './FieldMessage';

export function SelectField({
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
  const options = field.options ?? [];

  return (
    <div className="fh-field">
      <FieldLabel field={field} inputId={inputId} />
      <select
        id={inputId}
        className="fh-field__input fh-field__input--select"
        value={(value as string) ?? ''}
        disabled={disabled || loading}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        {field.placeholder && (
          <option value="" disabled>
            {field.placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldMessage error={error} helperText={field.helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
}
