import { useState } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, inputProps } from './fieldProps';

export function AutocompleteField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const listId = `${fieldId(props)}-list`;
  const options = field.options ?? [];
  const [text, setText] = useState('');
  const toValue = (input: string) => options.find((opt) => opt.label === input)?.value ?? input;
  const stored = (value as string) ?? '';

  return (
    <FieldShell id={fieldId(props)} field={field} error={error}>
      <input
        {...inputProps(props)}
        type="text"
        list={listId}
        className="fh-field__input fh-field__input--autocomplete"
        value={toValue(text) === stored ? text : (options.find((opt) => opt.value === stored)?.label ?? stored)}
        placeholder={field.placeholder}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          onChange(toValue(e.target.value));
        }}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.label} />
        ))}
      </datalist>
    </FieldShell>
  );
}
