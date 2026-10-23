import type { FieldOption } from '@formhaus/core';
import { type KeyboardEvent, useEffect, useState } from 'react';

interface ComboBoxProps {
  id: string;
  name: string;
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus?: () => void;
  parse?: (text: string) => string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  autoComplete?: string;
  testId?: string;
  className?: string;
}

const display = (options: FieldOption[], value: string) => options.find((option) => option.value === value)?.label ?? value;

export function ComboBox({
  id,
  name,
  options,
  value,
  onChange,
  onBlur,
  onFocus,
  parse,
  disabled,
  invalid,
  describedBy,
  placeholder,
  autoComplete,
  testId,
  className,
}: ComboBoxProps) {
  const [text, setText] = useState(() => display(options, value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const term = text.trim().toLowerCase();
  const shown = options.filter((option) => !term || option.label.toLowerCase().includes(term) || option.value === value);
  const list = `${id}--list`;

  const toValue = (typed: string) =>
    options.find((option) => option.label.toLowerCase() === typed.trim().toLowerCase())?.value ?? (parse ? parse(typed) : typed);

  useEffect(() => {
    setText((current) => (toValue(current) === value ? current : display(options, value)));
  }, [value]);

  function choose(option: FieldOption) {
    setText(option.label);
    setOpen(false);
    onChange(option.value);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => Math.max(0, Math.min(shown.length - 1, index + step)));
    } else if (event.key === 'Enter' && open && shown[active]) {
      event.preventDefault();
      choose(shown[active]!);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className={['usa-combo-box', text && 'usa-combo-box--pristine', className].filter(Boolean).join(' ')} data-enhanced="true">
      <input
        id={id}
        name={name}
        className={invalid ? 'usa-combo-box__input usa-input--error' : 'usa-combo-box__input'}
        role="combobox"
        aria-expanded={open}
        aria-controls={list}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? `${list}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        autoComplete={autoComplete ?? 'off'}
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        data-testid={testId}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
          setActive(-1);
          onChange(toValue(event.target.value));
        }}
        onKeyDown={keyDown}
        onFocus={onFocus}
        onBlur={() => {
          setOpen(false);
          onBlur();
        }}
      />
      <span className="usa-combo-box__clear-input__wrapper" tabIndex={-1}>
        <button
          type="button"
          className="usa-combo-box__clear-input"
          aria-label="Clear the select contents"
          disabled={disabled}
          onClick={() => {
            setText('');
            onChange('');
          }}
        >
          &nbsp;
        </button>
      </span>
      <span className="usa-combo-box__input-button-separator">&nbsp;</span>
      <span className="usa-combo-box__toggle-list__wrapper" tabIndex={-1}>
        <button
          type="button"
          tabIndex={-1}
          className="usa-combo-box__toggle-list"
          aria-label="Toggle the dropdown list"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setOpen(!open);
            document.getElementById(id)?.focus();
          }}
        >
          &nbsp;
        </button>
      </span>
      <div id={list} className="usa-combo-box__list" role="listbox" hidden={!open}>
        {shown.length ? (
          shown.map((option, index) => (
            <div
              key={option.value}
              id={`${list}-${index}`}
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              className={[
                'usa-combo-box__list-option',
                index === active && 'usa-combo-box__list-option--focused',
                option.value === value && 'usa-combo-box__list-option--selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
            >
              {option.label}
            </div>
          ))
        ) : (
          <div className="usa-combo-box__list-option--no-results">No results found</div>
        )}
      </div>
      <div className="usa-combo-box__status usa-sr-only" role="status">
        {open ? `${shown.length} results available.` : ''}
      </div>
    </div>
  );
}
