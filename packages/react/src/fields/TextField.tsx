import type { FieldComponentProps } from '../types';
import { FieldLabel } from './FieldLabel';
import { FieldMessage } from './FieldMessage';

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
    onChange(field.type === 'number' && v !== '' ? Number(v) : v);
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
      <FieldLabel field={field} inputId={inputId} />
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
      <FieldMessage error={error} helperText={field.helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
}
