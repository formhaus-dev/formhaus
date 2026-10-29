import type { FormField } from '@formhaus/core';
import { fileEntries, filesFull, pickFiles, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import { FileUpload as GovukFileUpload } from 'govuk-frontend';
import { type AriaAttributes, type ChangeEvent, type ComponentProps, useEffect, useRef, useState } from 'react';
import { initGovuk } from '../govuk';

type Classed = Pick<AriaAttributes, 'aria-invalid'> & { className?: string };

const classes = (base: string, { className, 'aria-invalid': invalid }: Classed) =>
  [base, className, invalid === true && `${base}--error`].filter(Boolean).join(' ');

const widths: Record<string, string> = {
  tel: 'govuk-input--width-20',
  number: 'govuk-input--width-10',
};

export function Input({ type = 'text', ...props }: ComponentProps<'input'>) {
  const number = type === 'number';
  return (
    <input
      {...props}
      type={number ? 'text' : type}
      inputMode={number ? (props.inputMode ?? 'numeric') : props.inputMode}
      spellCheck={type === 'email' || number ? false : undefined}
      className={classes('govuk-input', { ...props, className: widths[type] })}
    />
  );
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea rows={5} {...props} className={classes('govuk-textarea', { ...props, className: 'govuk-js-character-count' })} />;
}

export function Password({ autoComplete, ...props }: ComponentProps<'input'>) {
  return (
    <div className="govuk-input__wrapper govuk-password-input__wrapper">
      <input
        {...props}
        type="password"
        spellCheck={false}
        autoCapitalize="none"
        autoComplete={autoComplete ?? 'current-password'}
        className={classes('govuk-input', { ...props, className: 'govuk-password-input__input govuk-js-password-input-input' })}
      />
      <button
        type="button"
        className="govuk-button govuk-button--secondary govuk-password-input__toggle govuk-js-password-input-toggle"
        data-module="govuk-button"
        aria-controls={props.id}
        aria-label="Show password"
        hidden
      >
        Show
      </button>
    </div>
  );
}

const several = {
  'data-i18n.choose-files-button': 'Choose files',
  'data-i18n.drop-instruction': 'or drop files',
  'data-i18n.no-file-chosen': 'No files chosen',
};

export function FileUpload({ onChange, f, field, ...props }: ComponentProps<'input'> & { f: FieldProps; field: FormField }) {
  const root = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const change = useRef(onChange);
  change.current = props.multiple
    ? ({ target }) => {
        const picked = Array.from(target.files ?? []);
        target.value = '';
        if (!picked.length) return;
        const result = pickFiles(field, f.value, picked);
        if (result.value) f.change(result.value);
        setNotice(result.notice);
        setStatus(result.status);
      }
    : onChange;
  const describedBy = props['aria-describedby'];

  useEffect(() => {
    const wrapper = root.current!;
    const input = wrapper.querySelector('input')!;
    const listener = (event: Event) => change.current?.(event as unknown as ChangeEvent<HTMLInputElement>);
    input.addEventListener('change', listener);
    initGovuk(GovukFileUpload, wrapper);
    return () => input.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const button = root.current!.querySelector('.govuk-file-upload-button');
    if (describedBy) button?.setAttribute('aria-describedby', describedBy);
    else button?.removeAttribute('aria-describedby');
  }, [describedBy]);

  const entries = props.multiple ? fileEntries(f.value) : [];

  return (
    <>
      <div ref={root} className="govuk-file-upload-wrapper" data-module="govuk-file-upload" {...(props.multiple && several)}>
        <input
          {...props}
          type="file"
          disabled={props.disabled || (props.multiple && filesFull(field, f.value))}
          className={classes('govuk-file-upload', props)}
        />
      </div>
      {entries.length > 0 && (
        <dl className="govuk-summary-list govuk-!-margin-top-4 govuk-!-margin-bottom-0">
          {entries.map(({ index, name }) => (
            <div key={index} className="govuk-summary-list__row">
              <dt className="govuk-summary-list__key app-file-name" dir="auto">
                {name}
              </dt>
              <dd className="govuk-summary-list__actions">
                <button
                  type="button"
                  className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
                  disabled={props.disabled}
                  onClick={() => {
                    setNotice('');
                    f.change(removeFile(f.value, index));
                    setStatus(`${name} removed`);
                  }}
                >
                  Remove<span className="govuk-visually-hidden"> {name}</span>
                </button>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {notice && <p className="govuk-hint govuk-!-margin-top-2 govuk-!-margin-bottom-0">{notice}</p>}
      {props.multiple && (
        <p className="govuk-visually-hidden" role="status">
          {status}
        </p>
      )}
    </>
  );
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
