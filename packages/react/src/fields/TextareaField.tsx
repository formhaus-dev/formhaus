import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

const DEFAULT_ROWS = 3;

export function TextareaField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;

  return (
    <FieldShell field={field} error={error}>
      <textarea
        {...inputProps(props)}
        className="fh-field__input fh-field__input--textarea"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        rows={field.rows ?? DEFAULT_ROWS}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}
