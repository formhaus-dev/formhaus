import { type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, useRef } from 'react';
import { type ControlShellProps, mapControls } from '../../src/controls';
import type { FieldProps } from '../../src/fieldProps';
import type { FieldComponentProps } from '../../src/types';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; helper?: string };

function TextInput({ label, helper, ...props }: InputProps) {
  return (
    <span>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input {...props} />
      {helper && <small>{helper}</small>}
    </span>
  );
}

function Plain({ value, onChange, ...props }: Omit<InputProps, 'onChange'> & { onChange: (value: string) => void }) {
  return <input {...props} value={value} onChange={(event) => onChange(event.target.value)} />;
}

function DatePick({ value, onChange, ...props }: Omit<InputProps, 'onChange'> & { onChange: (value: { toDate(): Date } | null) => void }) {
  return (
    <input
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value ? { toDate: () => new Date(`${event.target.value}T00:00`) } : null)}
    />
  );
}

function Check({ label, ...props }: InputProps) {
  return (
    <span>
      <input type="checkbox" {...props} />
      {label && <label htmlFor={props.id}>{label}</label>}
    </span>
  );
}

interface ChoicesProps {
  id?: string;
  name?: string;
  value?: unknown;
  disabled?: boolean;
  label?: string;
  options: { value: string | number; label: string }[];
  onChange: (event: ChangeEvent<HTMLInputElement>, value: string) => void;
  children?: ReactNode;
}

function Choices({ id, name, value, disabled, label, options, onChange }: ChoicesProps) {
  return (
    <div role="radiogroup" id={id} aria-label={label}>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            disabled={disabled}
            checked={String(value) === String(option.value)}
            onChange={(event) => onChange(event, event.target.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function Picks({
  id,
  value,
  options,
  onChange,
}: {
  id?: string;
  value?: string[];
  options: { value: string; label: string }[];
  onChange: (value: { value: string }[]) => void;
}) {
  return (
    <select
      id={id}
      multiple
      value={value}
      onChange={(event) => onChange([...event.target.selectedOptions].map((option) => ({ value: option.value })))}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Stars({ id, value, onChange }: { id?: string; value?: unknown; onChange: (value: number) => void }) {
  return (
    <div id={id} role="radiogroup">
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          role="radio"
          tabIndex={0}
          aria-label={`${star} stars`}
          aria-checked={value === star}
          onClick={() => onChange(star)}
          onKeyDown={() => {}}
        />
      ))}
      <button type="button">Clear</button>
    </div>
  );
}

interface PickerProps {
  id?: string;
  value?: unknown;
  options: { value: string | number; label: string }[];
  onValueChange: (value: string) => void;
}

function Picker({ id, value, options, onValueChange }: PickerProps) {
  const arrow = useRef(false);
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      arrow.current = true;
      (event.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
      arrow.current = false;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onValueChange(event.currentTarget.value);
    }
  };
  return (
    <div id={id} role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          value={String(option.value)}
          aria-checked={String(value) === String(option.value)}
          onKeyDown={keyDown}
          onFocus={(event) => arrow.current && onValueChange(event.currentTarget.value)}
          onClick={(event) => onValueChange(event.currentTarget.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Shell({ kind, f, rootProps, children }: ControlShellProps) {
  const texts = (
    <>
      {f.helperText && <p id={f.helperId}>{f.helperText}</p>}
      {f.error && <p id={f.errorId}>{f.error}</p>}
    </>
  );
  if (kind === 'group')
    return (
      <fieldset {...rootProps} data-kind={kind}>
        <legend>{f.label}</legend>
        {children}
        {texts}
      </fieldset>
    );
  const label = <label htmlFor={f.id}>{f.label}</label>;
  return (
    <div {...rootProps} data-kind={kind}>
      {kind === 'input' && label}
      {children}
      {kind === 'inline' && label}
      {texts}
    </div>
  );
}

const MatrixRow = ({ field }: FieldComponentProps) => <div data-row={field.key}>{field.label}</div>;

const controls = {
  input: TextInput,
  password: Plain,
  textarea: [Plain, () => ({ placeholder: 'Long' })],
  select: [Plain, (f: FieldProps) => ({ list: f.options.map((option) => option.value).join() })],
  date: DatePick,
  checkbox: Check,
  switch: Check,
  radio: [Choices, 'options'],
  scale: [Choices, 'options'],
  rating: Stars,
  multiselect: [Picks, 'options'],
} as const;

export const mapped = {
  named: mapControls({ shell: Shell, controls: { radio: [Picker, 'options', 'onValueChange'] } }),
  shell: mapControls({ shell: Shell, kinds: { multiselect: 'input' }, matrix: MatrixRow, controls }),
  bare: mapControls({ shell: null, labels: (f: FieldProps) => ({ label: f.label }), kinds: { multiselect: 'input' }, controls }),
  mixed: mapControls({ shell: { group: Shell }, labels: (f: FieldProps) => ({ label: f.label }), controls }),
  doubled: mapControls({
    shell: Shell,
    labels: (f: FieldProps) => ({ label: f.label }),
    controls: { input: [TextInput, (f: FieldProps) => ({ label: f.label })] },
  }),
};
