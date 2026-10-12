import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, inputProps } from './fieldProps';

export function SelectField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const options = field.options ?? [];
  const current = (value as string) ?? '';

  return (
    <FieldShell id={fieldId(props)} field={field} error={error}>
      <select
        {...inputProps(props)}
        className="fh-field__input fh-field__input--select"
        value={current}
        onChange={(e) => onChange(e.target.value)}
      >
        {(field.placeholder || current === '') && (
          <option value="" disabled hidden={!field.placeholder}>
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
