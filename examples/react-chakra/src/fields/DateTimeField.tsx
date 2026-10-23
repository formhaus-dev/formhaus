import type { FieldComponentProps } from '@formhaus/react';
import { DateInput } from '@chakra-ui/react';
import { parseDateTime } from '@internationalized/date';
import { FieldShell } from './shared';

export function DateTimeField(props: FieldComponentProps) {
  const { id, field, value, error, onChange, onBlur, onFocus } = props;

  return (
    <FieldShell props={props}>
      <DateInput.Root
        name={field.key}
        invalid={!!error}
        ids={{ control: id }}
        granularity="minute"
        hourCycle={24}
        value={value ? [parseDateTime(String(value))] : []}
        onValueChange={(details) => onChange(details.value[0]?.toString().slice(0, 16) ?? '')}
      >
        <DateInput.Control onBlur={onBlur} onFocus={onFocus}>
          <DateInput.Segments />
        </DateInput.Control>
        <DateInput.HiddenInput />
      </DateInput.Root>
    </FieldShell>
  );
}
