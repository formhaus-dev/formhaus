import type { FieldComponentProps } from '@formhaus/react';
import { DateTimePicker } from '@mantine/dates';
import { inputProps } from './shared';

export function DateTimeField(props: FieldComponentProps) {
  const { value, onChange } = props;
  const stored = (value as string) || null;

  return (
    <DateTimePicker
      {...inputProps(props)}
      value={stored ? stored.replace('T', ' ') : null}
      valueFormat="MMM D, YYYY HH:mm"
      clearable
      onChange={(next) => onChange(next ? next.slice(0, 16).replace(' ', 'T') : '')}
    />
  );
}
