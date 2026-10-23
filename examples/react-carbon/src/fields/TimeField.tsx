import type { FieldComponentProps } from '@formhaus/react';
import { TimePicker } from '@carbon/react';
import { inputProps } from './shared';

export function TimeField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const { helperText: _helper, ...rest } = inputProps(props);

  return (
    <TimePicker
      {...rest}
      placeholder={field.placeholder ?? 'hh:mm'}
      pattern="([01]\d|2[0-3]):[0-5]\d"
      value={(value as string) ?? ''}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}
