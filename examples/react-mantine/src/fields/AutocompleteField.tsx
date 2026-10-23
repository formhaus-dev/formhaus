import type { FieldComponentProps } from '@formhaus/react';
import { Autocomplete } from '@mantine/core';
import { useState } from 'react';
import { inputProps } from './shared';

export function AutocompleteField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const options = field.options ?? [];
  const toValue = (text: string) => options.find((option) => option.label === text)?.value ?? text;
  const toText = (stored: string) => options.find((option) => option.value === stored)?.label ?? stored;
  const stored = (value as string) ?? '';
  const [text, setText] = useState(toText(stored));

  return (
    <Autocomplete
      {...inputProps(props)}
      data={options.map((option) => option.label)}
      value={toValue(text) === stored ? text : toText(stored)}
      autoComplete={field.autocomplete ?? 'off'}
      onChange={(next) => {
        setText(next);
        onChange(toValue(next));
      }}
    />
  );
}
