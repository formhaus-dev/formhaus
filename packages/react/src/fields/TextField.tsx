import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function TextField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(field.type === 'number' && v !== '' ? Number(v) : v);
  };

  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'phone'
        ? 'tel'
        : field.type === 'number'
          ? 'number'
          : field.type === 'password'
            ? 'password'
            : 'text';

  return (
    <FieldShell field={field} error={error}>
      <input
        {...inputProps(props)}
        type={inputType}
        className="fh-field__input"
        value={value != null ? String(value) : ''}
        placeholder={field.placeholder ?? field.mask}
        onChange={handleChange}
      />
    </FieldShell>
  );
}
