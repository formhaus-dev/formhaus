import type { FieldComponentProps } from '@formhaus/react';
import { Textarea } from '@mantine/core';
import { inputProps } from './shared';

export function TextareaField(props: FieldComponentProps) {
  const { field, value, onChange } = props;

  return (
    <Textarea
      {...inputProps(props)}
      value={(value as string) ?? ''}
      autosize
      minRows={field.rows ?? 3}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}
