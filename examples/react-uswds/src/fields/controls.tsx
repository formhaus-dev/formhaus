import { toggleOption } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import { type AriaAttributes, type ChangeEvent, type ComponentProps, useState } from 'react';

const classes = (base: string, invalid: AriaAttributes['aria-invalid'], extra?: string) =>
  [base, extra, invalid === true && 'usa-input--error'].filter(Boolean).join(' ');

const widths: Record<string, string> = { tel: 'usa-input--xl', number: 'usa-input--small' };

export function Input({ type = 'text', ...props }: ComponentProps<'input'>) {
  const number = type === 'number';
  return (
    <input
      {...props}
      type={number ? 'text' : type}
      inputMode={props.inputMode ?? (number ? 'decimal' : undefined)}
      spellCheck={type === 'email' || type === 'password' ? false : undefined}
      className={classes('usa-input', props['aria-invalid'], widths[type])}
    />
  );
}

export function Password(props: ComponentProps<'input'>) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Input {...props} type={shown ? 'text' : 'password'} spellCheck={false} />
      <button type="button" className="usa-show-password" aria-controls={props.id} onClick={() => setShown(!shown)}>
        {shown ? 'Hide password' : 'Show password'}
      </button>
    </>
  );
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea rows={5} {...props} className={classes('usa-textarea', props['aria-invalid'])} />;
}

export function Select({ options, placeholder, ...props }: ComponentProps<'select'> & { options: ControlOption[]; placeholder?: string }) {
  return (
    <select {...props} className={classes('usa-select', props['aria-invalid'])}>
      <option value="">{placeholder ?? '- Select -'}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox(props: ComponentProps<'input'>) {
  return <input {...props} type="checkbox" className="usa-checkbox__input" />;
}

interface ChoicesProps {
  f: FieldProps;
  options: ControlOption[];
  value: unknown;
  onChange: (value: unknown) => void;
  multiple?: boolean;
  stars?: boolean;
}

export function Choices({ f, options, value, onChange, multiple, stars }: ChoicesProps) {
  const kind = multiple ? 'checkbox' : 'radio';
  const tiles = options.some((option) => option.image);
  return options.map((option, index) => {
    const attrs = f.option({ ...option, value: String(option.value) }, index);
    return (
      <div key={option.value} className={`usa-${kind}`}>
        <input
          {...attrs}
          type={kind}
          className={tiles ? `usa-${kind}__input usa-${kind}__input--tile` : `usa-${kind}__input`}
          aria-invalid={multiple ? undefined : f.aria['aria-invalid']}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(multiple ? toggleOption(value, attrs.value) : event)}
        />
        <label className={`usa-${kind}__label`} htmlFor={attrs.id}>
          {option.image && <img src={option.image} alt="" className="choice__image" />}
          {option.label}
          {stars && <span className="usa-sr-only">{option.value === 1 ? ' star' : ' stars'}</span>}
        </label>
      </div>
    );
  });
}
