import type { FieldComponentProps } from '@formhaus/react';
import { DatePicker, DatePickerInput, FormGroup, Stack, TimePicker } from '@carbon/react';
import { fromIsoDate, groupProps, inputProps, toIsoDate } from './shared';
import { GroupMessage } from './GroupMessage';

export function DateTimeField(props: FieldComponentProps) {
  const { value, onChange } = props;
  const { id, invalid, invalidText, disabled, onBlur, onFocus } = inputProps(props);
  const [date = '', time = ''] = String(value ?? '').split('T');
  const write = (nextDate: string, nextTime: string) => onChange(nextDate || nextTime ? `${nextDate}T${nextTime}` : '');

  return (
    <FormGroup {...groupProps(props)}>
      <Stack orientation="horizontal" gap={5}>
        <DatePicker
          datePickerType="single"
          dateFormat="m/d/Y"
          value={date ? fromIsoDate(date) : ''}
          onChange={([picked]) => write(picked ? toIsoDate(picked) : '', time)}
        >
          <DatePickerInput
            id={id}
            labelText="Date"
            placeholder="mm/dd/yyyy"
            invalid={invalid && !date}
            invalidText={invalidText}
            disabled={disabled}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        </DatePicker>
        <TimePicker
          id={`${id}-time`}
          labelText="Time"
          placeholder="hh:mm"
          pattern="([01]\d|2[0-3]):[0-5]\d"
          invalid={invalid && (!time || !!date)}
          invalidText={invalidText}
          disabled={disabled}
          value={time}
          onChange={(event) => write(date, event.currentTarget.value)}
          onBlur={onBlur}
        />
      </Stack>
      <GroupMessage helper={props.field.helperText} />
    </FormGroup>
  );
}
