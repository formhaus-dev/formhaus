import type { FieldOption } from '@formhaus/core';
import type { FieldComponentProps } from '@formhaus/react';
import { ComboBox } from '@carbon/react';
import { inputProps } from './shared';

export function AutocompleteField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const { labelText, name: _name, ...rest } = inputProps(props);
  const options = field.options ?? [];
  const stored = (value as string) ?? '';
  const selected = options.find((option) => option.value === stored) ?? null;

  return (
    <ComboBox<FieldOption>
      {...rest}
      titleText={labelText}
      placeholder={field.placeholder}
      items={options}
      itemToString={(option) => option?.label ?? ''}
      allowCustomValue
      selectedItem={selected}
      shouldFilterItem={({ item, inputValue }) => !inputValue || item.label.toLowerCase().includes(inputValue.toLowerCase())}
      onInputChange={(text) => onChange(options.find((option) => option.label === text)?.value ?? text)}
      onChange={({ selectedItem }) => selectedItem && onChange(selectedItem.value)}
    />
  );
}
