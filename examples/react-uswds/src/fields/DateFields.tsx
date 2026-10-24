import { useState } from 'react';
import { ComboBox } from './ComboBox';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (part: number | string) => String(part).padStart(2, '0');

export const times = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 ? 30 : 0;
  return { value: `${pad(hour)}:${pad(minute)}`, label: `${hour % 12 || 12}:${pad(minute)}${hour < 12 ? 'am' : 'pm'}` };
});

export function parseTime(text: string) {
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(text.trim());
  if (!match) return text;
  const hour = (Number(match[1]) % (match[3] ? 12 : 24)) + (match[3]?.toLowerCase() === 'pm' ? 12 : 0);
  return `${pad(hour)}:${match[2]}`;
}

interface Parts {
  month: string;
  day: string;
  year: string;
}

function split(value: string): Parts {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? { year: match[1]!, month: String(Number(match[2])), day: String(Number(match[3])) } : { month: '', day: '', year: '' };
}

function join({ month, day, year }: Parts) {
  if (!month && !day && !year) return '';
  return `${year}-${month ? pad(month) : ''}-${day ? pad(day) : ''}`;
}

interface DateProps {
  id: string;
  'aria-describedby'?: string;
  name: string;
  value: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export function MemorableDate({ id, name, value, onChange, ...events }: DateProps) {
  const [draft, setDraft] = useState(() => split(value));
  const current = join(draft) === value ? draft : split(value);
  const update = (part: keyof Parts, text: string) => {
    const next = { ...current, [part]: text.replace(/\D/g, '') };
    setDraft(next);
    onChange(join(next));
  };
  const input = events['aria-invalid'] ? 'usa-input usa-input--error' : 'usa-input';

  const hints = (part: keyof Parts) => [`${id}-${part}-hint`, events['aria-describedby']].filter(Boolean).join(' ');

  return (
    <>
      <span className="usa-hint" aria-hidden="true">
        Select a month. Enter 1 or 2 digits for the day and 4 digits for the year.
      </span>
      <div className="usa-memorable-date">
        <div className="usa-form-group usa-form-group--month usa-form-group--select">
          <label className="usa-label" htmlFor={id}>
            Month
          </label>
          <span id={`${id}-month-hint`} className="usa-sr-only">
            Select a month.
          </span>
          <select
            {...events}
            aria-describedby={hints('month')}
            id={id}
            name={`${name}-month`}
            className={events['aria-invalid'] ? 'usa-select usa-input--error' : 'usa-select'}
            value={current.month}
            onChange={(event) => update('month', event.target.value)}
          >
            <option value="">- Select -</option>
            {months.map((month, index) => (
              <option key={month} value={String(index + 1)}>
                {pad(index + 1)} - {month}
              </option>
            ))}
          </select>
        </div>
        <div className="usa-form-group usa-form-group--day">
          <label className="usa-label" htmlFor={`${id}-day`}>
            Day
          </label>
          <span id={`${id}-day-hint`} className="usa-sr-only">
            Enter 1 or 2 digits.
          </span>
          <input
            {...events}
            aria-describedby={hints('day')}
            id={`${id}-day`}
            name={`${name}-day`}
            className={input}
            inputMode="numeric"
            maxLength={2}
            value={current.day}
            onChange={(event) => update('day', event.target.value)}
          />
        </div>
        <div className="usa-form-group usa-form-group--year">
          <label className="usa-label" htmlFor={`${id}-year`}>
            Year
          </label>
          <span id={`${id}-year-hint`} className="usa-sr-only">
            Enter 4 digits.
          </span>
          <input
            {...events}
            aria-describedby={hints('year')}
            id={`${id}-year`}
            name={`${name}-year`}
            className={input}
            inputMode="numeric"
            minLength={4}
            maxLength={4}
            value={current.year}
            onChange={(event) => update('year', event.target.value)}
          />
        </div>
      </div>
    </>
  );
}

export function DateTime({ id, name, value, onChange, ...events }: DateProps) {
  const [date = '', time = ''] = value.split('T');
  return (
    <>
      <MemorableDate {...events} id={id} name={name} value={date} onChange={(next) => onChange(next || time ? `${next}T${time}` : '')} />
      <div className="usa-form-group">
        <label className="usa-label" htmlFor={`${id}-time`}>
          Time of day
        </label>
        <ComboBox
          {...events}
          id={`${id}-time`}
          name={`${name}-time`}
          className="usa-time-picker"
          options={times}
          parse={parseTime}
          value={time}
          onChange={(next) => onChange(date || next ? `${date}T${next}` : '')}
        />
      </div>
    </>
  );
}
