import type { FieldOption } from '@formhaus/core';
import { optionValue } from '@formhaus/core/fields';
import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { ComboBox } from '@carbon/react';
import { label, texts } from './labels';

export function AutocompleteField(props: FieldComponentProps) {
  const f = fieldProps(props);

  return (
    <ComboBox<FieldOption>
      {...texts(f)}
      id={f.id}
      titleText={label(f)}
      placeholder={f.placeholder}
      disabled={f.disabled}
      items={f.options}
      itemToString={(option) => option?.label ?? ''}
      allowCustomValue
      selectedItem={f.options.find((option) => option.value === f.value) ?? null}
      shouldFilterItem={({ item, inputValue }) => !inputValue || item.label.toLowerCase().includes(inputValue.toLowerCase())}
      onInputChange={(text) => f.change(optionValue(f.options, text))}
      onChange={({ selectedItem }) => selectedItem && f.change(selectedItem.value)}
      onBlur={f.blur}
      onFocus={f.focus}
    />
  );
}
