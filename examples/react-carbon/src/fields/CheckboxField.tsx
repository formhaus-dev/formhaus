import type { FieldComponentProps } from '@formhaus/react';
import { Checkbox } from '@carbon/react';
import { inputProps } from './shared';

export function CheckboxField(props: FieldComponentProps) {
  const { value, onChange } = props;

  return <Checkbox {...inputProps(props)} checked={value === true} onChange={(_, { checked }) => onChange(checked)} />;
}
