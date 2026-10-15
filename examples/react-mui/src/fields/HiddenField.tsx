import type { FieldComponentProps } from '@formhaus/react';

export function HiddenField({ id, field, value }: FieldComponentProps) {
  return <input type="hidden" id={id} name={field.key} value={value != null ? String(value) : ''} />;
}
