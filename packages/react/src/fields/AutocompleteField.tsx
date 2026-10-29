import { freeText } from '@formhaus/core/fields';
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
  const typed = freeText(options, value, text, (next, input) => {
    setText(input);
    onChange(next);
  });

  return (
    <FieldShell id={fieldId(props)} field={field} error={error}>
      <input
        {...inputProps(props)}
        type="text"
        list={listId}
        className="fh-field__input fh-field__input--autocomplete"
        value={typed.text}
        placeholder={field.placeholder}
        autoComplete={field.autocomplete ?? 'off'}
        onChange={(e) => typed.setText(e.target.value)}
      />
      <datalist id={listId}>
        {texts.map((text) => (
          <option key={text} value={text} />
        ))}
      </datalist>
    </FieldShell>
  );
}
