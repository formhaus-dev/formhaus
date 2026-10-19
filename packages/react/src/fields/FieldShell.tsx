import type { FormField } from '@formhaus/core';
import type { ReactNode } from 'react';
import { FieldLabel } from './FieldLabel';
import { describedBy } from './fieldProps';

interface FieldShellProps {
  id: string;
  field: FormField;
  error?: string;
  variant?: 'checkbox' | 'switch' | 'radio' | 'multiselect' | 'scale' | 'rating';
  children: ReactNode;
}

export function FieldShell({ id, field, error, variant, children }: FieldShellProps) {
  const inline = variant === 'checkbox' || variant === 'switch';
  const group = variant && !inline;
  const Root = group ? 'fieldset' : 'div';
  const container = `fh-field__${variant === 'rating' ? 'scale' : variant}-${group ? 'group' : 'wrapper'}`;
  const helper = field.helperText && (
    <p id={`${id}-helper`} className="fh-field__helper">
      {field.helperText}
    </p>
  );

  return (
    <Root
      className={variant ? `fh-field fh-field--${variant}` : 'fh-field'}
      aria-invalid={group ? !!error || undefined : undefined}
      aria-describedby={group ? describedBy(field, id, error) : undefined}
    >
      {group && field.label && <legend className="fh-field__label">{field.label}</legend>}
      {!variant && <FieldLabel field={field} inputId={id} />}
      {!inline && helper}
      {variant ? (
        <div className={group && field.layout === 'inline' ? `${container} ${container}--inline` : container} data-columns={field.columns}>
          {children}
          {inline && field.label && (
            <label className="fh-field__label" htmlFor={id}>
              {field.label}
            </label>
          )}
        </div>
      ) : (
        children
      )}
      {inline && helper}
      {error && (
        <p id={`${id}-error`} className="fh-field__error" role="alert">
          {error}
        </p>
      )}
    </Root>
  );
}
