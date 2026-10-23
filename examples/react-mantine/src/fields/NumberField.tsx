import type { FieldComponentProps } from '@formhaus/react';
import { NumberInput } from '@mantine/core';
import { inputProps } from './shared';

export function NumberField(props: FieldComponentProps) {
  const { field, value, onChange } = props;

  return (
    <NumberInput
      {...inputProps(props)}
      value={typeof value === 'number' ? value : ''}
      min={field.validation?.min}
      max={field.validation?.max}
      onChange={(next) => onChange(typeof next === 'number' ? next : null)}
    />
  );
}
