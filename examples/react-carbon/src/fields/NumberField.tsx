import type { FieldComponentProps } from '@formhaus/react';
import { NumberInput } from '@carbon/react';
import { inputProps } from './shared';

export function NumberField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const { labelText, ...rest } = inputProps(props);

  return (
    <NumberInput
      {...rest}
      label={labelText}
      allowEmpty
      value={typeof value === 'number' ? value : ''}
      min={field.validation?.min}
      max={field.validation?.max}
      onChange={(_, state) => {
        const next = typeof state.value === 'number' ? state.value : state.value === '' ? null : Number(state.value);
        onChange(next === null || Number.isNaN(next) ? null : next);
      }}
    />
  );
}
