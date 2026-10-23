import type { FormField } from '@formhaus/core';
import type { FieldComponentProps } from '@formhaus/react';
import { useState } from 'react';
import { ComboBox } from './ComboBox';
import { describedBy } from './field';
import { FormGroup } from './FormGroup';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (part: number | string) => String(part).padStart(2, '0');

const times = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 ? 30 : 0;
  return { value: `${pad(hour)}:${pad(minute)}`, label: `${hour % 12 || 12}:${pad(minute)}${hour < 12 ? 'am' : 'pm'}` };
});

function parseTime(text: string) {
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

interface PartProps {
  id: string;
  field: FormField;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus?: () => void;
}

function MemorableDate({ id, field, value, error, disabled, onChange, onBlur, onFocus }: PartProps) {
  const [draft, setDraft] = useState(() => split(value));
  const current = join(draft) === value ? draft : split(value);
  const update = (part: keyof Parts, text: string) => {
    const next = { ...current, [part]: text.replace(/\D/g, '') };
    setDraft(next);
    onChange(join(next));
  };
  const input = error ? 'usa-input usa-input--error' : 'usa-input';
  const events = { onBlur, onFocus, disabled, 'aria-describedby': describedBy(id, field, error), 'aria-invalid': error ? true : undefined };

  return (
    <div className="usa-memorable-date">
      <div className="usa-form-group usa-form-group--month usa-form-group--select">
        <label className="usa-label" htmlFor={id}>
          Month
        </label>
        <select
          id={id}
          name={`${field.key}-month`}
          className={error ? 'usa-select usa-input--error' : 'usa-select'}
          value={current.month}
          onChange={(event) => update('month', event.target.value)}
          {...events}
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
        <input
          id={`${id}-day`}
          name={`${field.key}-day`}
          className={input}
          inputMode="numeric"
          maxLength={2}
          value={current.day}
          onChange={(event) => update('day', event.target.value)}
          {...events}
        />
      </div>
      <div className="usa-form-group usa-form-group--year">
        <label className="usa-label" htmlFor={`${id}-year`}>
          Year
        </label>
        <input
          id={`${id}-year`}
          name={`${field.key}-year`}
          className={input}
          inputMode="numeric"
          minLength={4}
          maxLength={4}
          value={current.year}
          onChange={(event) => update('year', event.target.value)}
          {...events}
        />
      </div>
    </div>
  );
}

function TimePicker({ id, field, value, error, disabled, onChange, onBlur, onFocus }: PartProps) {
  return (
    <ComboBox
      id={id}
      name={field.key}
      className="usa-time-picker"
      options={times}
      parse={parseTime}
      value={value}
      placeholder={field.placeholder}
      invalid={!!error}
      describedBy={describedBy(id, field, error)}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  );
}

export function DateField({ id = '', field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const text = typeof value === 'string' ? value : '';
  const parts = { id, field, error, disabled: disabled || loading, onBlur, onFocus };

  if (field.type === 'time')
    return (
      <FormGroup id={id} field={field} error={error}>
        <TimePicker {...parts} value={text} onChange={onChange} />
      </FormGroup>
    );

  const [date = '', time = ''] = text.split('T');
  return (
    <FormGroup id={id} field={field} error={error} fieldset>
      <MemorableDate
        {...parts}
        value={field.type === 'datetime' ? date : text}
        onChange={(next) => onChange(field.type === 'datetime' ? (next || time ? `${next}T${time}` : '') : next)}
      />
      {field.type === 'datetime' && (
        <div className="usa-form-group">
          <label className="usa-label" htmlFor={`${id}-time`}>
            Time
          </label>
          <TimePicker {...parts} id={`${id}-time`} value={time} onChange={(next) => onChange(date || next ? `${date}T${next}` : '')} />
        </div>
      )}
    </FormGroup>
  );
}
