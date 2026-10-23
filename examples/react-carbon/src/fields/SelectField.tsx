import type { FieldComponentProps } from '@formhaus/react';
import { Select, SelectItem } from '@carbon/react';
import { inputProps } from './shared';

export function SelectField(props: FieldComponentProps) {
  const { field, value, onChange } = props;

  return (
    <Select {...inputProps(props)} value={(value as string) ?? ''} onChange={(event) => onChange(event.currentTarget.value)}>
      <SelectItem value="" text={field.placeholder ?? 'Choose an option'} disabled hidden />
      {(field.options ?? []).map((option) => (
        <SelectItem key={option.value} value={option.value} text={option.label} />
      ))}
    </Select>
  );
}
