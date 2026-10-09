import { useRef } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { optionProps } from './fieldProps';

export function RadioField(props: FieldComponentProps) {
  const { field, value, error, onChange, onCommit } = props;
  const arrowSelection = useRef(false);
  const commit = field.autoAdvance && onCommit;
  const options = field.options ?? [];

  return (
    <FieldShell field={field} error={error} variant="radio">
      {options.map((opt) => {
        const optionId = `${field.key}-${opt.value}`;
        return (
          <div key={opt.value} className="fh-field__radio-option">
            <input
              {...optionProps(props)}
              id={optionId}
              type="radio"
              className="fh-field__radio"
              name={field.key}
              value={opt.value}
              checked={String(value) === String(opt.value)}
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
            />
            <label className="fh-field__radio-label" htmlFor={optionId}>
              {opt.label}
            </label>
          </div>
        );
      })}
    </FieldShell>
  );
}
