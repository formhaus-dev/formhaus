import type { FieldComponentProps } from '@formhaus/react';
import { DatePickerInput } from '@mantine/dates';
import { inputProps } from './shared';

export function DateField(props: FieldComponentProps) {
  const { value, onChange } = props;

  return (
    <DatePickerInput
      {...inputProps(props)}
      value={(value as string) || null}
      valueFormat="MMM D, YYYY"
      clearable
      onChange={(next) => onChange(next ?? '')}
    />
  );
}
