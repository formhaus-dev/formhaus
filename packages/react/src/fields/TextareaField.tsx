import type { FieldComponentProps } from '../types';
import { FieldLabel } from './FieldLabel';
import { FieldMessage } from './FieldMessage';

const DEFAULT_ROWS = 3;

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
      <FieldLabel field={field} inputId={inputId} />
      <textarea
        id={inputId}
        className="fh-field__input fh-field__input--textarea"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        rows={field.rows ?? DEFAULT_ROWS}
        disabled={disabled || loading}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
      <FieldMessage error={error} helperText={field.helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
}
