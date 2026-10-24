import type { FieldOption } from '@formhaus/core';
import { optionText, optionValue } from '@formhaus/core/fields';
import { type ComponentProps, useState } from 'react';
import { Input } from '@/components/ui/input';

type AutocompleteInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
};

export function AutocompleteInput({ options, value, onChange, ...input }: AutocompleteInputProps) {
  const [text, setText] = useState('');
  const list = `${input.id}-list`;
  return (
    <>
      <Input
        {...input}
        list={list}
        autoComplete={input.autoComplete ?? 'off'}
        value={optionValue(options, text) === value ? text : optionText(options, value)}
        onChange={(event) => {
          setText(event.target.value);
          onChange(optionValue(options, event.target.value));
        }}
      />
      <datalist id={list}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </>
  );
}
