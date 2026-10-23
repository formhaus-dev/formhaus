import { optionText, optionValue } from '@formhaus/core/fields';
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
  const toValue = (input: string) => optionValue(options, input);
  const stored = (value as string) ?? '';

  return (
    <FieldShell id={fieldId(props)} field={field} error={error}>
      <input
        {...inputProps(props)}
        type="text"
        list={listId}
        className="fh-field__input fh-field__input--autocomplete"
        value={toValue(text) === stored ? text : optionText(options, stored)}
        placeholder={field.placeholder}
        autoComplete={field.autocomplete ?? 'off'}
        onChange={(e) => {
          setText(e.target.value);
          onChange(toValue(e.target.value));
        }}
      />
      <datalist id={listId}>
        {texts.map((text) => (
          <option key={text} value={text} />
        ))}
      </datalist>
    </FieldShell>
  );
}
