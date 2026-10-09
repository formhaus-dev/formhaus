import { useRef } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldMessage } from './FieldMessage';

export function RadioField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
  onCommit,
  onBlur,
  onFocus,
}: FieldComponentProps) {
  const arrowSelection = useRef(false);
  const commit = field.autoAdvance && onCommit;
  const groupId = field.key;
  const helperId = `${field.key}-helper`;
  const errorId = `${field.key}-error`;
  const describedBy = error ? errorId : field.helperText ? helperId : undefined;
  const options = field.options ?? [];

  return (
    <fieldset
      className="fh-field fh-field--radio"
      aria-invalid={!!error || undefined}
      aria-describedby={describedBy}
    >
      {field.label && <legend className="fh-field__label">{field.label}</legend>}
      <div className="fh-field__radio-group">
        {options.map((opt) => {
          const optionId = `${groupId}-${opt.value}`;
          return (
            <div key={opt.value} className="fh-field__radio-option">
              <input
                id={optionId}
                type="radio"
                className="fh-field__radio"
                name={groupId}
                value={opt.value}
                checked={String(value) === String(opt.value)}
                disabled={disabled || loading}
                onChange={() => { if (!commit || arrowSelection.current) onChange(opt.value); }}
                onKeyDown={(event) => {
                  arrowSelection.current = event.key.startsWith('Arrow');
                  if (commit && event.key === ' ') event.preventDefault();
                  if (commit && event.key === 'Enter') {
                    event.preventDefault();
                    if (!event.repeat) commit(opt.value);
                  }
                }}
                onKeyUp={(event) => {
                  arrowSelection.current = false;
                  if (commit && event.key === ' ') { event.preventDefault(); commit(opt.value); }
                }}
                onPointerDown={() => { arrowSelection.current = false; }}
                onClick={(event) => {
                  if (!commit || arrowSelection.current) return;
                  if (event.detail > 1) event.preventDefault();
                  else commit(opt.value);
                }}
                onBlur={onBlur}
                onFocus={onFocus}
              />
              <label className="fh-field__radio-label" htmlFor={optionId}>
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
      <FieldMessage error={error} helperText={field.helperText} errorId={errorId} helperId={helperId} />
    </fieldset>
  );
}
