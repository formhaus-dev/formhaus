import type { FieldComponentProps } from '@formhaus/react';
import { TimePicker } from '@mantine/dates';
import { inputProps } from './shared';

export function TimeField(props: FieldComponentProps) {
  const { value, onChange } = props;
  const { placeholder: _placeholder, ...rest } = inputProps(props);

  return <TimePicker {...rest} value={(value as string) ?? ''} clearable onChange={(next) => onChange(next.slice(0, 5))} />;
}
