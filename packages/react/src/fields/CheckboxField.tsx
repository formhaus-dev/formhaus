import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function CheckboxField(props: FieldComponentProps) {
  return (
    <FieldShell field={props.field} error={props.error} variant="checkbox">
      <input
        {...inputProps(props)}
        type="checkbox"
        className="fh-field__checkbox"
        checked={!!props.value}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    </FieldShell>
  );
}
