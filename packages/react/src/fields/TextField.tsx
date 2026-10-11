import { useState } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function TextField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const isNumber = field.type === 'number';
  const [draft, setDraft] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDraft(v);
    onChange(isNumber && v !== '' ? Number(v) : v);
  };

  const text = isNumber && draft && Object.is(Number(draft), value) ? draft : String(value ?? '');

  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'phone'
        ? 'tel'
        : isNumber
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
        value={text}
        placeholder={field.placeholder ?? field.mask}
        inputMode={field.inputMode}
        onChange={handleChange}
      />
    </FieldShell>
  );
}
