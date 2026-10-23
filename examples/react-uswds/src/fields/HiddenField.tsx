import type { FieldComponentProps } from '@formhaus/react';

export function HiddenField({ id, field, value }: FieldComponentProps) {
  return <input id={id} type="hidden" name={field.key} value={value === undefined || value === null ? '' : String(value)} />;
}
