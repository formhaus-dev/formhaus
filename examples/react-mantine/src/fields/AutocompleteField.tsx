import { optionText, optionValue } from '@formhaus/core/fields';
import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Autocomplete } from '@mantine/core';
import { useState } from 'react';
import { labels } from './labels';

export function AutocompleteField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const [text, setText] = useState(optionText(f.options, f.value));
  return (
    <Autocomplete
      {...f.input}
      {...labels(f)}
      data={f.options.map((option) => option.label)}
      value={optionValue(f.options, text) === f.text ? text : optionText(f.options, f.value)}
      comboboxProps={{ keepMounted: false }}
      onChange={(next) => {
        setText(next);
        f.change(optionValue(f.options, next));
      }}
    />
  );
}
