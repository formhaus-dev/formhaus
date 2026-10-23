import type { FieldComponentProps } from '@formhaus/react';
import { Select } from '@mantine/core';
import { inputProps } from './shared';

export function SelectField(props: FieldComponentProps) {
  const { field, value, onChange } = props;

  return (
    <Select
      {...inputProps(props)}
      data={field.options ?? []}
      value={(value as string) || null}
      allowDeselect={false}
      onChange={(next) => onChange(next ?? '')}
    />
  );
}
