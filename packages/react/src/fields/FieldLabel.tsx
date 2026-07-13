import type { FormField } from '@formhaus/core';

interface FieldLabelProps {
  field: FormField;
  inputId: string;
}

export function FieldLabel({ field, inputId }: FieldLabelProps) {
  if (!field.label) return null;
  return (
    <label className="fh-field__label" htmlFor={inputId}>
      {field.label}
      {field.validation?.required && (
        <span className="fh-field__required" aria-hidden="true"> *</span>
      )}
    </label>
  );
}
