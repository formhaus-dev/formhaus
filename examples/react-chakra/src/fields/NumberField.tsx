import type { FieldComponentProps } from '@formhaus/react';
import { NumberInput } from '@chakra-ui/react';
import { FieldShell } from './shared';

export function NumberField(props: FieldComponentProps) {
  const { field, value, onChange, onBlur, onFocus } = props;

  return (
    <FieldShell props={props}>
      <NumberInput.Root
        width="full"
        name={field.key}
        value={typeof value === 'number' ? String(value) : ''}
        min={field.validation?.min}
        max={field.validation?.max}
        onValueChange={(details) => onChange(Number.isNaN(details.valueAsNumber) ? null : details.valueAsNumber)}
      >
        <NumberInput.Control />
        <NumberInput.Input placeholder={field.placeholder} onBlur={onBlur} onFocus={onFocus} />
      </NumberInput.Root>
    </FieldShell>
  );
}
