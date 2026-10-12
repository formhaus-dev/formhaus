import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, inputProps } from './fieldProps';

export function SwitchField(props: FieldComponentProps) {
  return (
    <FieldShell id={fieldId(props)} field={props.field} error={props.error} variant="switch">
      <input
        {...inputProps(props)}
        type="checkbox"
        role="switch"
        className="fh-field__switch"
        checked={!!props.value}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    </FieldShell>
  );
}
