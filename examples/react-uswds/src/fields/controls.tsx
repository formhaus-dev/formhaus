import { type FormField, getDefaultMessage } from '@formhaus/core';
import { addFiles, fileEntries, fileLimit, removeFile, toggleOption } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import { type AriaAttributes, type ChangeEvent, type ComponentProps, Fragment, useState } from 'react';

const classes = (base: string, invalid: AriaAttributes['aria-invalid'], ...extra: (string | undefined)[]) =>
  [base, ...extra, invalid === true && 'usa-input--error'].filter(Boolean).join(' ');

const widths: Record<string, string> = { tel: 'usa-input--xl', number: 'usa-input--small' };

export function Input({ type = 'text', ...props }: ComponentProps<'input'>) {
  const number = type === 'number';
  return (
    <input
      {...props}
      type={number ? 'text' : type}
      inputMode={props.inputMode ?? (number ? 'decimal' : undefined)}
      spellCheck={type === 'email' || type === 'password' ? false : undefined}
      className={classes('usa-input', props['aria-invalid'], widths[type], props.className)}
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
  return <textarea {...props} className={classes('usa-textarea', props['aria-invalid'], props.className)} />;
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

export function FileInput({ f, field, onChange, ...props }: ComponentProps<'input'> & { f: FieldProps; field: FormField }) {
  const [notice, setNotice] = useState('');
  const list = !!props.multiple;
  const max = fileLimit(field);
  const disabled = props.disabled || (list && addFiles(f.value, []).length >= max);
  const picked = !list && f.value instanceof File ? f.value : null;
  const entries = list ? fileEntries(f.value) : [];
  const add = ({ target }: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(target.files ?? []);
    target.value = '';
    if (!files.length) return;
    const next = addFiles(f.value, files, max);
    setNotice(
      next.length < addFiles(f.value, files).length ? (field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max })) : '',
    );
    f.change(next);
  };
  return (
    <>
      <div className={disabled ? 'usa-file-input usa-file-input--disabled' : 'usa-file-input'}>
        <div className={picked ? 'usa-file-input__target has-file' : 'usa-file-input__target'}>
          {picked ? (
            <>
              <div className="usa-file-input__preview-heading">
                Selected file <span className="usa-file-input__choose">Change file</span>
              </div>
              <div className="usa-file-input__preview" aria-hidden="true">
                {picked.name}
              </div>
            </>
          ) : (
            <div className="usa-file-input__instructions" aria-hidden="true">
              <span className="usa-file-input__drag-text">{list ? 'Drag files here or ' : 'Drag file here or '}</span>
              <span className="usa-file-input__choose">choose from folder</span>
            </div>
          )}
          <div className="usa-file-input__box" />
          <input {...props} type="file" disabled={disabled} className="usa-file-input__input" onChange={list ? add : onChange} />
        </div>
      </div>
      {entries.length > 0 && (
        <ul className="files">
          {entries.map(({ index, name }) => (
            <li key={index} className="files__item">
              <span className="files__name">{name}</span>
              <button
                type="button"
                className="usa-button usa-button--unstyled"
                disabled={props.disabled}
                onClick={() => {
                  setNotice('');
                  f.change(removeFile(f.value, index));
                }}
              >
                Remove<span className="usa-sr-only"> {name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {notice && <div className="usa-hint files__notice">{notice}</div>}
    </>
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
  matrix?: boolean;
}

export function Choices({ f, options, value, onChange, multiple, stars, matrix }: ChoicesProps) {
  const kind = multiple ? 'checkbox' : 'radio';
  const tiles = options.some((option) => option.image);
  return options.map((option, index) => {
    const attrs = f.option({ ...option, value: String(option.value) }, index);
    return (
      <Fragment key={option.value}>
        <div className={matrix ? 'usa-radio matrix__cell' : `usa-${kind}`}>
          <input
            {...attrs}
            type={kind}
            className={tiles ? `usa-${kind}__input usa-${kind}__input--tile` : `usa-${kind}__input`}
            aria-invalid={multiple ? undefined : f.aria['aria-invalid']}
            aria-controls={option.reveal?.id}
            {...(multiple && { 'aria-expanded': option.reveal?.open })}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(multiple ? toggleOption(value, attrs.value) : event)}
          />
          <label className={`usa-${kind}__label`} htmlFor={attrs.id}>
            {matrix ? (
              <span className="usa-sr-only">{option.label}</span>
            ) : (
              <>
                {option.image && <img src={option.image} alt="" className="choice__image" />}
                {option.label}
                {stars && <span className="usa-sr-only">{option.value === 1 ? ' star' : ' stars'}</span>}
              </>
            )}
          </label>
        </div>
        {option.reveal && (
          <div id={option.reveal.id} data-fh="reveal" hidden={!option.reveal.open} className="reveal">
            {option.reveal.children}
          </div>
        )}
      </Fragment>
    );
  });
}
