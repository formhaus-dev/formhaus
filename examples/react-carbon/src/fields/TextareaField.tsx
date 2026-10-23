import type { FieldComponentProps } from '@formhaus/react';
import { TextArea } from '@carbon/react';
import { inputProps } from './shared';

export function TextareaField(props: FieldComponentProps) {
  const { field, value, onChange } = props;

  return (
    <TextArea
      {...inputProps(props)}
      rows={field.rows ?? 3}
      value={(value as string) ?? ''}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}
