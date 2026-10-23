import { inputType } from '@formhaus/core/fields';
import { useState } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, inputProps } from './fieldProps';

export function TextField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const isNumber = field.type === 'number';
  const [draft, setDraft] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDraft(v);
    onChange(isNumber ? (v === '' ? null : Number(v)) : v);
  };

  const text = isNumber && draft && Object.is(Number(draft), value) ? draft : String(value ?? '');

  return (
    <FieldShell id={fieldId(props)} field={field} error={error}>
      <input
        {...inputProps(props)}
        type={inputType(field)}
        className="fh-field__input"
        value={text}
        placeholder={field.placeholder ?? field.mask}
        inputMode={field.inputMode}
        onChange={handleChange}
      />
    </FieldShell>
  );
}
