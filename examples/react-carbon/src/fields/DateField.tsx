import type { FieldComponentProps } from '@formhaus/react';
import { DatePicker, DatePickerInput } from '@carbon/react';
import { fromIsoDate, inputProps, toIsoDate } from './shared';

export function DateField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const { name: _name, ...rest } = inputProps(props);

  return (
    <DatePicker
      datePickerType="single"
      dateFormat="m/d/Y"
      value={value ? fromIsoDate(String(value)) : ''}
      onChange={([date]) => onChange(date ? toIsoDate(date) : '')}
    >
      <DatePickerInput {...rest} placeholder={field.placeholder ?? 'mm/dd/yyyy'} />
    </DatePicker>
  );
}
