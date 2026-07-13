import type { FieldComponentProps } from '../types';
import { FieldLabel } from './FieldLabel';
import { FieldMessage } from './FieldMessage';

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
      <FieldLabel field={field} inputId={inputId} />
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
      <FieldMessage error={error} helperText={field.helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
}
