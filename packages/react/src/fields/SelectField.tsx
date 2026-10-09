import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function SelectField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const options = field.options ?? [];

  return (
    <FieldShell field={field} error={error}>
      <select
        {...inputProps(props)}
        className="fh-field__input fh-field__input--select"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.placeholder && (
          <option value="" disabled>
            {field.placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
