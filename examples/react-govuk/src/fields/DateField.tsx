import type { FieldComponentProps } from '@formhaus/react';
import { useState } from 'react';
import { FormGroup } from './FormGroup';

const parts = [
  { name: 'day', label: 'Day', width: 'govuk-input--width-2' },
  { name: 'month', label: 'Month', width: 'govuk-input--width-2' },
  { name: 'year', label: 'Year', width: 'govuk-input--width-4' },
] as const;

type Parts = Record<(typeof parts)[number]['name'], string>;

function split(value: unknown): Parts {
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  return match ? { year: match[1]!, month: String(Number(match[2])), day: String(Number(match[3])) } : { day: '', month: '', year: '' };
}

function join({ day, month, year }: Parts): string | undefined {
  if (!day && !month && !year) return undefined;
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) return `${year}-${month}-${day}`;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function DateField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const [draft, setDraft] = useState(() => split(value));

  return (
    <FormGroup id={id} field={field} error={error} fieldset>
      <div className="govuk-date-input" id={`${id}-group`}>
        {parts.map((part, index) => {
          const partId = index === 0 ? id : `${id}-${part.name}`;
          return (
            <div key={part.name} className="govuk-date-input__item">
              <div className="govuk-form-group">
                <label className="govuk-label govuk-date-input__label" htmlFor={partId}>
                  {part.label}
                </label>
                <input
                  id={partId}
                  className={['govuk-input govuk-date-input__input', part.width, error && 'govuk-input--error'].filter(Boolean).join(' ')}
                  name={`${field.key}-${part.name}`}
                  type="text"
                  inputMode="numeric"
                  value={draft[part.name]}
                  disabled={disabled || loading}
                  onChange={(event) => {
                    const next = { ...draft, [part.name]: event.target.value.trim() };
                    setDraft(next);
                    onChange(join(next));
                  }}
                  onBlur={onBlur}
                  onFocus={onFocus}
                />
              </div>
            </div>
          );
        })}
      </div>
    </FormGroup>
  );
}
