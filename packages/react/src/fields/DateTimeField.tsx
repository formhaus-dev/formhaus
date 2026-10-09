import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function DateTimeField(props: FieldComponentProps) {
  return (
    <FieldShell field={props.field} error={props.error}>
      <input
        {...inputProps(props)}
        type="datetime-local"
        className="fh-field__input fh-field__input--datetime"
        value={String(props.value ?? '')}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </FieldShell>
  );
}
