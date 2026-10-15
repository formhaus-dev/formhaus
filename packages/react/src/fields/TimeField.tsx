import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, inputProps } from './fieldProps';

export function TimeField(props: FieldComponentProps) {
  return (
    <FieldShell id={fieldId(props)} field={props.field} error={props.error}>
      <input
        {...inputProps(props)}
        type="time"
        className="fh-field__input fh-field__input--time"
        value={String(props.value ?? '')}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </FieldShell>
  );
}
