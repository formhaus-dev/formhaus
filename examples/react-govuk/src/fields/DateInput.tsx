import { useState } from 'react';

const parts = {
  day: { label: 'Day', width: 'govuk-input--width-2' },
  month: { label: 'Month', width: 'govuk-input--width-2' },
  year: { label: 'Year', width: 'govuk-input--width-4' },
  hour: { label: 'Hour', width: 'govuk-input--width-2' },
  minute: { label: 'Minute', width: 'govuk-input--width-2' },
} as const;

type Part = keyof typeof parts;
type Parts = Record<Part, string>;

const dateParts: Part[] = ['day', 'month', 'year'];
const timeParts: Part[] = ['hour', 'minute'];
const layouts: Record<string, Part[][]> = {
  date: [dateParts],
  time: [timeParts],
  'datetime-local': [dateParts, timeParts],
};

const trimZero = (text = '') => (text ? String(Number(text)) : '');
const pad = (text: string) => (/^\d$/.test(text) ? `0${text}` : text);

function split(value: string): Parts {
  const [, year = '', month, day, hour = '', minute = ''] = /^(?:(\d{4})-(\d{2})-(\d{2}))?T?(?:(\d{2}):(\d{2}))?/.exec(value) ?? [];
  return { day: trimZero(day), month: trimZero(month), year, hour, minute };
}

function join(type: string, values: Parts) {
  if ((layouts[type] ?? layouts.date!).flat().every((name) => !values[name])) return '';
  const date = `${values.year}-${pad(values.month)}-${pad(values.day)}`;
  const time = `${pad(values.hour)}:${pad(values.minute)}`;
  return type === 'time' ? time : type === 'date' ? date : `${date}T${time}`;
}

interface DateInputProps {
  id: string;
  name: string;
  type: string;
  value: string;
  autoComplete?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export function DateInput({
  id,
  name,
  type,
  value,
  autoComplete,
  disabled,
  'aria-invalid': invalid,
  onChange,
  onBlur,
  onFocus,
}: DateInputProps) {
  const [draft, setDraft] = useState(() => split(value));
  const current = join(type, draft) === value ? draft : split(value);

  return (layouts[type] ?? layouts.date!).map((block, blockIndex) => (
    <div key={block[0]} className={blockIndex ? 'govuk-!-margin-top-4' : undefined}>
      {blockIndex > 0 && <p className="govuk-label">Time</p>}
      <div id={`${id}-${blockIndex ? 'time' : 'parts'}`} className="govuk-date-input">
        {block.map((part, index) => {
          const partId = blockIndex === 0 && index === 0 ? id : `${id}-${part}`;
          return (
            <div key={part} className="govuk-date-input__item">
              <div className="govuk-form-group">
                <label className="govuk-label govuk-date-input__label" htmlFor={partId}>
                  {parts[part].label}
                </label>
                <input
                  id={partId}
                  className={['govuk-input govuk-date-input__input', parts[part].width, invalid && 'govuk-input--error']
                    .filter(Boolean)
                    .join(' ')}
                  name={`${name}-${part}`}
                  autoComplete={autoComplete === 'bday' && blockIndex === 0 ? `bday-${part}` : undefined}
                  type="text"
                  inputMode="numeric"
                  value={current[part]}
                  disabled={disabled}
                  aria-invalid={invalid}
                  onChange={(event) => {
                    const next = { ...current, [part]: event.target.value.trim() };
                    setDraft(next);
                    onChange(join(type, next));
                  }}
                  onBlur={onBlur}
                  onFocus={onFocus}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ));
}
