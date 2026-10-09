import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function DateField(props: FieldComponentProps) {
  return (
    <FieldShell field={props.field} error={props.error}>
      <input
        {...inputProps(props)}
        type="date"
        className="fh-field__input fh-field__input--date"
        value={String(props.value ?? '')}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </FieldShell>
  );
}
