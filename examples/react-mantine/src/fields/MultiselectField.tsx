import type { FieldComponentProps } from '@formhaus/react';
import { MultiSelect } from '@mantine/core';
import { inputProps } from './shared';

export function MultiselectField(props: FieldComponentProps) {
  const { field, value, onChange } = props;

  return (
    <MultiSelect
      {...inputProps(props)}
      data={field.options ?? []}
      searchable
      value={Array.isArray(value) ? (value as string[]) : []}
      onChange={onChange}
    />
  );
}
