import { fromDate, toDate } from '@formhaus/core/fields';
import { DatePicker, DatePickerInput, type DatePickerInputProps } from '@carbon/react';

interface DateInputProps extends Omit<DatePickerInputProps, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function DateInput({ value, onChange, ...input }: DateInputProps) {
  return (
    <DatePicker
      datePickerType="single"
      dateFormat="m/d/Y"
      value={toDate(value) ?? ''}
      onChange={([date]) => onChange(fromDate(date) ?? '')}
    >
      <DatePickerInput placeholder="mm/dd/yyyy" {...input} />
    </DatePicker>
  );
}
