import type { FieldComponentProps } from '@formhaus/react';
import { DatePicker, parseDate } from '@chakra-ui/react';
import { FieldShell } from './shared';

export function DateField(props: FieldComponentProps) {
  const { id, field, value, error, onChange, onBlur, onFocus } = props;

  return (
    <FieldShell props={props}>
      <DatePicker.Root
        name={field.key}
        invalid={!!error}
        ids={{ input: () => id ?? field.key }}
        value={value ? [parseDate(String(value))] : []}
        onValueChange={(details) => onChange(details.value[0]?.toString() ?? '')}
      >
        <DatePicker.Control>
          <DatePicker.Input placeholder={field.placeholder ?? 'mm/dd/yyyy'} onBlur={onBlur} onFocus={onFocus} />
          <DatePicker.IndicatorGroup>
            <DatePicker.Trigger />
          </DatePicker.IndicatorGroup>
        </DatePicker.Control>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </DatePicker.Root>
    </FieldShell>
  );
}
