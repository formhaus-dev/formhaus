import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { FormGroup, Stack, TimePicker } from '@carbon/react';
import { DateInput } from './DateInput';
import { Texts } from './GroupMessage';
import { label } from './labels';

export function DateTimeField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const [date = '', time = ''] = f.text.split('T');
  const write = (nextDate: string, nextTime: string) => f.change(nextDate || nextTime ? `${nextDate}T${nextTime}` : '');
  const dateInvalid = f.invalid && !date;
  const error = <span id={f.errorId}>{f.error}</span>;

  return (
    <FormGroup legendText={label(f)} invalid={f.invalid} data-fh="field">
      <Stack orientation="horizontal" gap={5}>
        <DateInput
          id={f.id}
          labelText="Date"
          aria-label={`${f.label} date`}
          aria-describedby={f.describedBy}
          invalid={dateInvalid}
          invalidText={dateInvalid && error}
          disabled={f.disabled}
          value={date}
          onChange={(next) => write(next, time)}
          onBlur={f.blur}
          onFocus={f.focus}
        />
        <TimePicker
          id={`${f.id}-time`}
          labelText="Time"
          aria-label={`${f.label} time`}
          aria-describedby={f.describedBy}
          placeholder="hh:mm"
          pattern="([01]\d|2[0-3]):[0-5]\d"
          invalid={f.invalid && !dateInvalid}
          invalidText={!dateInvalid && error}
          disabled={f.disabled}
          value={time}
          onChange={(event) => write(date, event.currentTarget.value)}
          onBlur={f.blur}
        />
      </Stack>
      <Texts id={f.id} helperText={f.helperText} />
    </FormGroup>
  );
}
