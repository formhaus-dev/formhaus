import type { FieldComponentProps } from '../types';
import { FieldLabel } from './FieldLabel';
import { FieldMessage } from './FieldMessage';

export function AutocompleteField({
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
  const listId = `${field.key}-list`;
  const helperId = `${field.key}-helper`;
  const errorId = `${field.key}-error`;
  const describedBy = error ? errorId : field.helperText ? helperId : undefined;
  const options = field.options ?? [];

  return (
    <div className="fh-field">
      <FieldLabel field={field} inputId={inputId} />
      <input
        id={inputId}
        type="text"
        list={listId}
        className="fh-field__input fh-field__input--autocomplete"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        disabled={disabled || loading}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </datalist>
      <FieldMessage error={error} helperText={field.helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
}
