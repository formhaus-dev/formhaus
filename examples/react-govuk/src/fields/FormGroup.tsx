import type { FormField } from '@formhaus/core';
import type { ReactNode } from 'react';

interface FormGroupProps {
  id?: string;
  field: FormField;
  error?: string;
  fieldset?: boolean;
  label?: string;
  children: ReactNode;
}

export const labelText = (field: FormField, label = field.label ?? '') => (field.validation?.required ? label : `${label} (optional)`);

export const describedBy = (id: string | undefined, field: FormField, error?: string) =>
  [field.helperText && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

export function FormGroup({ id, field, error, fieldset, label, children }: FormGroupProps) {
  const text = labelText(field, label);
  const notes = (
    <>
      {field.helperText && (
        <div id={`${id}-hint`} className="govuk-hint">
          {field.helperText}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {error}
        </p>
      )}
    </>
  );

  return (
    <div className={error ? 'govuk-form-group govuk-form-group--error' : 'govuk-form-group'}>
      {fieldset ? (
        <fieldset className="govuk-fieldset" aria-describedby={describedBy(id, field, error)}>
          <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">{text}</legend>
          {notes}
          {children}
        </fieldset>
      ) : (
        <>
          <label className="govuk-label govuk-label--s" htmlFor={id}>
            {text}
          </label>
          {notes}
          {children}
        </>
      )}
    </div>
  );
}
