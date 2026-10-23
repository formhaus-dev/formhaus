import type { FormField } from '@formhaus/core';
import type { ReactNode } from 'react';
import { describedBy } from './field';

interface FormGroupProps {
  id: string;
  field: FormField;
  error?: string;
  fieldset?: boolean;
  children: ReactNode;
}

function Label({ field }: { field: FormField }) {
  return (
    <>
      {field.label}
      {field.validation?.required && (
        <>
          {' '}
          <abbr title="required" className="usa-hint usa-hint--required">
            *
          </abbr>
        </>
      )}
    </>
  );
}

export function FormGroup({ id, field, error, fieldset, children }: FormGroupProps) {
  const notes = (
    <>
      {field.helperText && (
        <div id={`${id}-hint`} className="usa-hint">
          {field.helperText}
        </div>
      )}
      {error && (
        <span id={`${id}-error`} className="usa-error-message" role="alert">
          {error}
        </span>
      )}
    </>
  );

  return (
    <div className={error ? 'usa-form-group usa-form-group--error' : 'usa-form-group'} data-fh="field">
      {fieldset ? (
        <fieldset className="usa-fieldset" aria-describedby={describedBy(id, field, error)}>
          <legend className={error ? 'usa-legend usa-label--error' : 'usa-legend'}>
            <Label field={field} />
          </legend>
          {notes}
          {children}
        </fieldset>
      ) : (
        <>
          <label className={error ? 'usa-label usa-label--error' : 'usa-label'} htmlFor={id}>
            <Label field={field} />
          </label>
          {notes}
          {children}
        </>
      )}
    </div>
  );
}
