import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { FileInput } from '@mantine/core';
import { labels } from './labels';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <FileInput
      {...f.input}
      {...labels(f)}
      accept={props.field.accept}
      clearable
      placeholder={f.placeholder ?? 'Choose a file'}
      value={f.value instanceof File ? f.value : null}
      onChange={f.change}
    />
  );
}
