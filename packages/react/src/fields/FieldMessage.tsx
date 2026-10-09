import type { FormField } from '@formhaus/core';

interface FieldMessageProps {
  field: FormField;
  error?: string;
}

export function FieldMessage({ field, error }: FieldMessageProps) {
  if (error) {
    return <p id={`${field.key}-error`} className="fh-field__error" role="alert">{error}</p>;
  }
  if (field.helperText) {
    return <p id={`${field.key}-helper`} className="fh-field__helper">{field.helperText}</p>;
  }
  return null;
}
