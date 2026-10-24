import { toggleOption } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import type { AriaAttributes, ChangeEvent, ComponentProps } from 'react';

type Classed = Pick<AriaAttributes, 'aria-invalid'> & { className?: string };

const classes = (base: string, { className, 'aria-invalid': invalid }: Classed) =>
  [base, className, invalid === true && `${base}--error`].filter(Boolean).join(' ');

const widths: Record<string, string> = {
  tel: 'govuk-input--width-20',
  number: 'govuk-input--width-10',
  time: 'govuk-input--width-5',
  'datetime-local': 'govuk-input--width-10',
};

export function Input({ type = 'text', ...props }: ComponentProps<'input'>) {
  const number = type === 'number';
  return (
    <input
      {...props}
      type={number ? 'text' : type}
      inputMode={number ? 'numeric' : props.inputMode}
      spellCheck={type === 'email' ? false : undefined}
      className={classes('govuk-input', { ...props, className: widths[type] })}
    />
  );
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea rows={5} {...props} className={classes('govuk-textarea', props)} />;
}

export function FileUpload(props: ComponentProps<'input'>) {
  return <input {...props} type="file" className={classes('govuk-file-upload', props)} />;
}

export function Select({ options, placeholder, ...props }: ComponentProps<'select'> & { options: ControlOption[]; placeholder?: string }) {
  return (
    <select {...props} className={classes('govuk-select', props)}>
      <option value="">{placeholder ?? 'Choose an option'}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox(props: ComponentProps<'input'>) {
  return <input {...props} type="checkbox" className="govuk-checkboxes__input" />;
}

interface ChoicesProps {
  f: FieldProps;
  options: ControlOption[];
  value: unknown;
  onChange: (value: unknown) => void;
  multiple?: boolean;
  className?: string;
}

export function Choices({ f, options, value, onChange, multiple, className }: ChoicesProps) {
  const kind = multiple ? 'checkboxes' : 'radios';
  const tiles = options.some((option) => option.image);
  return (
    <div className={[`govuk-${kind}`, className, tiles && 'app-tiles'].filter(Boolean).join(' ')}>
      {options.map((option, index) => {
        const attrs = f.option({ ...option, value: String(option.value) }, index);
        return (
          <div key={option.value} className={`govuk-${kind}__item`}>
            <input
              {...attrs}
              type={multiple ? 'checkbox' : 'radio'}
              className={`govuk-${kind}__input`}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(multiple ? toggleOption(value, attrs.value) : event)}
            />
            <label className={`govuk-label govuk-${kind}__label`} htmlFor={attrs.id}>
              {option.image && <img src={option.image} alt="" className="app-tile__image" />}
              {option.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}
