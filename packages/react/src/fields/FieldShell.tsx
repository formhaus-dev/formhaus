import type { FormField } from '@formhaus/core';
import type { ReactNode } from 'react';
import { FieldLabel } from './FieldLabel';
import { FieldMessage } from './FieldMessage';
import { describedBy } from './fieldProps';

interface FieldShellProps {
  field: FormField;
  error?: string;
  variant?: 'checkbox' | 'switch' | 'radio' | 'multiselect';
  children: ReactNode;
}

export function FieldShell({ field, error, variant, children }: FieldShellProps) {
  const group = variant === 'radio' || variant === 'multiselect';
  const Root = group ? 'fieldset' : 'div';

  return (
    <Root
      className={variant ? `fh-field fh-field--${variant}` : 'fh-field'}
      aria-invalid={group ? !!error || undefined : undefined}
      aria-describedby={group ? describedBy(field, error) : undefined}
    >
      {group && field.label && <legend className="fh-field__label">{field.label}</legend>}
      {variant ? (
        <div className={`fh-field__${variant}-${group ? 'group' : 'wrapper'}`}>
          {children}
          {!group && field.label && (
            <label className="fh-field__label" htmlFor={field.key}>
              {field.label}
            </label>
          )}
        </div>
      ) : (
        <>
          <FieldLabel field={field} inputId={field.key} />
          {children}
        </>
      )}
      <FieldMessage field={field} error={error} />
    </Root>
  );
}
