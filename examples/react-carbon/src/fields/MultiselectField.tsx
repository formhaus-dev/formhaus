import type { FieldOption } from '@formhaus/core';
import type { FieldComponentProps } from '@formhaus/react';
import { FilterableMultiSelect } from '@carbon/react';
import { inputProps } from './shared';

export function MultiselectField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const { labelText, name: _name, ...rest } = inputProps(props);
  const options = field.options ?? [];
  const selected = Array.isArray(value) ? options.filter((option) => (value as string[]).includes(option.value)) : [];

  return (
    <FilterableMultiSelect<FieldOption>
      {...rest}
      titleText={labelText}
      placeholder={field.placeholder}
      items={options}
      itemToString={(option) => option?.label ?? ''}
      selectedItems={selected}
      onChange={({ selectedItems }) => onChange((selectedItems ?? []).map((option) => option.value))}
    />
  );
}
