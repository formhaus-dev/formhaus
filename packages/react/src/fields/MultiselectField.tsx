import type { FieldComponentProps } from '../types';

export function MultiselectField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
  onBlur,
}: FieldComponentProps) {
  const groupId = field.key;
  const helperId = `${field.key}-helper`;
  const errorId = `${field.key}-error`;
  const describedBy = error ? errorId : field.helperText ? helperId : undefined;
  const options = field.options ?? [];
  const selected = Array.isArray(value) ? (value as (string | number)[]) : [];

  function handleToggle(optValue: string) {
    const next = selected.includes(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange(next);
  }

  return (
    <fieldset
      className="fh-field fh-field--multiselect"
      aria-invalid={!!error || undefined}
      aria-describedby={describedBy}
    >
      {field.label && <legend className="fh-field__label">{field.label}</legend>}
      <div className="fh-field__multiselect-group">
        {options.map((opt) => {
          const optionId = `${groupId}-${opt.value}`;
          return (
            <div key={opt.value} className="fh-field__multiselect-option">
              <input
                id={optionId}
                type="checkbox"
                className="fh-field__checkbox"
                checked={selected.includes(opt.value)}
                disabled={disabled || loading}
                onChange={() => handleToggle(opt.value)}
                onBlur={onBlur}
              />
              <label className="fh-field__multiselect-label" htmlFor={optionId}>
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
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
    </fieldset>
  );
}
