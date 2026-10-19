import { optionTexts } from '@formhaus/core/internal';
import { useMemo, useState } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { fieldId, inputProps } from './fieldProps';

export function AutocompleteField(props: FieldComponentProps) {
  const { field, value, error, onChange } = props;
  const listId = `${fieldId(props)}-list`;
  const options = field.options ?? [];
  const [text, setText] = useState('');
  const texts = useMemo(() => optionTexts(options), [field.options]);
  const toValue = (input: string) => options[texts.indexOf(input)]?.value ?? input;
  const stored = (value as string) ?? '';
  const index = options.findIndex((opt) => opt.value === stored);

  return (
    <FieldShell id={fieldId(props)} field={field} error={error}>
      <input
        {...inputProps(props)}
        type="text"
        list={listId}
        className="fh-field__input fh-field__input--autocomplete"
        value={toValue(text) === stored ? text : index < 0 ? stored : texts[index]}
        placeholder={field.placeholder}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          onChange(toValue(e.target.value));
        }}
      />
      <datalist id={listId}>
        {options.map((opt, index) => (
          <option key={opt.value} value={texts[index]} />
        ))}
      </datalist>
    </FieldShell>
  );
}
