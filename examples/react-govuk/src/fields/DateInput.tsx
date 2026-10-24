import { useState } from 'react';

const parts = [
  { name: 'day', label: 'Day', width: 'govuk-input--width-2' },
  { name: 'month', label: 'Month', width: 'govuk-input--width-2' },
  { name: 'year', label: 'Year', width: 'govuk-input--width-4' },
] as const;

type Parts = Record<(typeof parts)[number]['name'], string>;

function split(value: string): Parts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { year: match[1]!, month: String(Number(match[2])), day: String(Number(match[3])) } : { day: '', month: '', year: '' };
}

function join({ day, month, year }: Parts) {
  if (!day && !month && !year) return '';
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) return `${year}-${month}-${day}`;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

interface DateInputProps {
  id: string;
  name: string;
  value: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export function DateInput({ id, name, value, disabled, 'aria-invalid': invalid, onChange, onBlur, onFocus }: DateInputProps) {
  const [draft, setDraft] = useState(() => split(value));
  const current = join(draft) === value ? draft : split(value);

  return (
    <div className="govuk-date-input">
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
                className={['govuk-input govuk-date-input__input', part.width, invalid && 'govuk-input--error'].filter(Boolean).join(' ')}
                name={`${name}-${part.name}`}
                type="text"
                inputMode="numeric"
                value={current[part.name]}
                disabled={disabled}
                aria-invalid={invalid}
                onChange={(event) => {
                  const next = { ...current, [part.name]: event.target.value.trim() };
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
  );
}
