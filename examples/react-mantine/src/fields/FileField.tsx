import type { FieldComponentProps } from '@formhaus/react';
import { FileInput } from '@mantine/core';
import { inputProps } from './shared';

export function FileField(props: FieldComponentProps) {
  const { field, value, onChange } = props;

  return (
    <FileInput
      {...inputProps(props)}
      accept={field.accept}
      clearable
      placeholder={field.placeholder ?? 'Choose a file'}
      value={value instanceof File ? value : null}
      onChange={(file) => onChange(file)}
    />
  );
}
